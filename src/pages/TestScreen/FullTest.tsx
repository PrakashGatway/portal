// pages/student/FullLengthTestPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Controller, useForm } from "react-hook-form";
import {
    // ... other imports
    Download, // Add this
} from "lucide-react";
import {
    BookOpen,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    ChevronLeft,
    HelpCircle,
    Mic,
    Square,
    Home,
    BarChart3,
    Play,
    Pause,
    Volume2,
    Settings,
    Monitor,
    Globe,
    Chrome,
    Info,


} from "lucide-react";

import api from "../../axiosInstance";
import Button from "../../components/ui/button/Button";
import VoiceVerification from "../../components/voice/VoiceVerification";
import SpeakingTestSection from "../../components/speaking/SpeakingTestSection";

interface SectionDTO {
    index: number;
    sectionId:
    | {
        _id: string;
        name: string;
        description?: string;
    }
    | string;
    duration: number;
    totalQuestions: number;
    status: "not_started" | "in_progress" | "completed";
    timeSpent: number;
}

interface TestSeriesDTO {
    title: string;
    type: "Full-Length" | "Mini-Series" | "Sectional";
    duration: number;
    totalQuestions: number;
    totalSections: number;
}

interface QuestionOption {
    label?: string;
    text: string;
}

interface SubQuestion {
    _id: string;
    question: string;
    options?: QuestionOption[];
}

interface QuestionGroup {
    _id: string;
    title: string;
    instruction?: string;
    type: string;
    marks: number;
    questions: SubQuestion[];
}

interface QuestionDTO {
    _id: string;
    title?: string;
    content: {
        instruction: string;
        passageTitle?: string;
        passageText?: string;
        imageUrl?: string;
        audioUrl?: string;
    };
    isQuestionGroup: boolean;
    questionType: string;
    questionGroup?: QuestionGroup[];
    options?: QuestionOption[];
}

interface ProgressDTO {
    currentSection: number;
    totalSections: number;
    currentQuestion: number;
    questionsAnswered: number;
    totalQuestions: number;
    completionPercentage: number;
}

interface NumberingDTO {
    sectionIndex: number;
    questionIndex: number;
    questionCount: number;
    firstGlobalQuestionNumber: number;
    totalGlobalQuestions: number;
    firstSectionQuestionNumber: number;
    totalSectionQuestions: number;
}

interface UserAnswerItem {
    questionGroupId?: string;
    questionId: string;
    answer: any;
}

interface SummaryAnalysis {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    totalScore: number;
    accuracy: number;
    timeSpent: number;
    averageTimePerQuestion: number;
}

interface SectionWiseAnalysis {
    sectionType: string;
    sectionId: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    score: number;
}

interface AnalysisDTO {
    summary: SummaryAnalysis;
    questionAnalysis: any[];
    sectionWiseAnalysis: SectionWiseAnalysis[];
}

type QuestionFormValues = {
    answers: Record<string, any>;
};

// ---------- Helper utilities ----------

const formatSeconds = (totalSeconds: number | null | undefined) => {
    if (totalSeconds == null || totalSeconds < 0) return "00:00";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${mm}:${ss}`;
};

const getSectionStatusBadge = (status: SectionDTO["status"]) => {
    switch (status) {
        case "completed":
            return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800";
        case "in_progress":
            return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
};

// Improve the isWritingType function
const isWritingType = (t: string) => {
    if (!t) return false;
    
    const writingTypes = [
        'writing_task_1_academic',
        'writing_task_1_general', 
        'writing_task_2',
        'writing',
        'essay',
        'letter',
        'report'
    ];
    
    const text = t.toLowerCase();
    return writingTypes.some(type => text.includes(type));
};



// FullLengthTestPage.tsx mein isSpeakingType function ko update karo:

const isSpeakingType = (t: string, instruction?: string) => {
    if (!t && !instruction) return false;
    
    const textToCheck = (t + " " + (instruction || "")).toLowerCase();
    console.log(`🔊 isSpeakingType checking: "${textToCheck}"`);
    
    // Expand the speaking keywords - make them case-insensitive
    const speakingKeywords = [
        'speaking',
        'speaking_part',
        'speaking test',
        'introduction & interview',
        'speaking section',
        'oral test',
        'speech',
        'cue card',      // This should match
        'describe',     
        'talk about',   
        'topic',
        'part 2',
        'part 3',
        'you should say:',  // Cue card instruction
        'preparation time', // Cue card specific
        'speaking time'     // Cue card specific
    ];
    
    // Check all keywords
    const result = speakingKeywords.some(keyword => textToCheck.includes(keyword));
    console.log(`🔊 isSpeakingType result: ${result}`);
    
    return result;
};

// FullLengthTestPage.tsx mein detectSpeakingQuestion function ko update karo:

const detectSpeakingQuestion = (question: QuestionDTO): boolean => {
    console.log("🎤 DETECTING SPEAKING QUESTION:", {
        title: question.title,
        type: question.questionType,
        instruction: question.content.instruction?.substring(0, 100) + "...",
        hasCueCard: !!question.cueCard,
        cueCardPrompts: question.cueCard?.prompts,
        cueCardPromptsLength: question.cueCard?.prompts?.length,
        hasQuestionGroup: !!question.questionGroup,
        questionGroupType: question.questionGroup?.[0]?.type,
        questionGroupTitle: question.questionGroup?.[0]?.title
    });

    // IMPORTANT: Pehle writing check - agar writing hai to definitely NOT speaking
    if (isWritingType(question.questionType)) {
        console.log("📝 Writing section detected - NOT speaking");
        return false;
    }

    // Method 1: Check question type directly
    if (question.questionCategory?.toLowerCase() === 'speaking') {
        console.log("✅ Detected via questionCategory");
        return true;
    }

    // Method 2: Check if it has cue card prompts (IMPORTANT: Only if prompts exist)
    if (question.cueCard?.prompts && question.cueCard.prompts.length > 0) {
        console.log("✅ Detected via cueCard prompts (has prompts)");
        return true;
    }

    // Method 3: Check question group type
    if (question.questionGroup?.some(group => {
        const isSpeakingGroup = group.type?.toLowerCase().includes('speaking') || 
                               group.title?.toLowerCase().includes('cue card') ||
                               group.instruction?.toLowerCase().includes('you should say');
        return isSpeakingGroup;
    })) {
        console.log("✅ Detected via questionGroup");
        return true;
    }

    // Method 4: Check title and instruction
    const combinedText = (question.title + " " + question.content.instruction).toLowerCase();
    const speakingIndicators = [
        'speaking',
        'cue card',
        'describe',
        'you should say',
        'preparation time',
        'speaking time',
        'talk about',
        'part 1',
        'part 2',
        'part 3'
    ];

    const found = speakingIndicators.some(indicator => combinedText.includes(indicator));
    console.log(`📊 Title/instruction detection: ${found}`);
    
    return found;
};

const isListeningType = (t: string) =>
    ["listening", "audio_response"].includes(t) ||
    t?.toLowerCase()?.includes("listening");

// ---------- Component ----------

const FullLengthTestPage: React.FC = () => {
    const { testSeriesId } = useParams<{ testSeriesId: string }>();

    const [loading, setLoading] = useState(true);
    const [testSeries, setTestSeries] = useState<TestSeriesDTO | null>(null);
    const [sections, setSections] = useState<SectionDTO[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Line 60 ke aas paas
    const [viewMode, setViewMode] = useState<"sections" | "question" | "result" | "voice_verification">("sections");
    const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);

    const [currentQuestion, setCurrentQuestion] = useState<QuestionDTO | null>(null);
    const [progress, setProgress] = useState<ProgressDTO | null>(null);
    const [numbering, setNumbering] = useState<NumberingDTO | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisDTO | null>(null);

    const [sectionTimeLeft, setSectionTimeLeft] = useState<number | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const questionStartRef = useRef<number | null>(null);
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const globalCounterRef = useRef(1);
    // const [showVoiceVerification, setShowVoiceVerification] = useState(false);



    const [currentQuestionId, setCurrentQuestionId] = useState<string>("");






    // YE FUNCTION ADD KARO Component ke top mein:
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);


    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { isSubmitting },
    } = useForm<QuestionFormValues>({
        defaultValues: { answers: {} },
    });

    // ---------- TTS ----------
    const handleSpeak = (text: string | undefined) => {
        if (!text) {
            console.error("No text provided");
            return;
        }

        if (typeof window === "undefined") return;
        if (!("speechSynthesis" in window)) {
            console.error("Speech synthesis not supported");
            return;
        }

        // HTML tags remove karo
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        if (!cleanText) {
            console.error("Clean text is empty");
            return;
        }

        // Wait for voices to load
        const speakText = () => {
            window.speechSynthesis.cancel();

            const utter = new SpeechSynthesisUtterance(cleanText);
            utter.rate = 1;
            utter.pitch = 1;
            utter.volume = 1;

            // Optional: Set voice
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const englishVoice = voices.find(v => v.lang.startsWith('en'));
                if (englishVoice) utter.voice = englishVoice;
            }

            utter.onerror = (event) => {
                console.error('Speech synthesis error:', event);
            };

            utter.onend = () => {
                console.log('Speech finished');
            };

            window.speechSynthesis.speak(utter);
            console.log("Speaking started:", cleanText.substring(0, 50) + "...");
        };

        // Add voice selection for speaking questions
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    
    // For speaking questions, use a more natural voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        // Prefer US English female voice for speaking tests
        const speakingVoice = voices.find(v => 
            v.lang.startsWith('en-US') && 
            v.name.toLowerCase().includes('female')
        ) || voices.find(v => v.lang.startsWith('en'));
        
        if (speakingVoice) utter.voice = speakingVoice;
    }

        // Check if voices are loaded
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = speakText;
        } else {
            speakText();
        }
    };

    // ---------- Speaking recording ----------
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (e) {
            console.error("Unable to access microphone", e);
            setGlobalError("Could not access microphone. Check permissions.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    // ---------- Load / resume test ----------
    const fetchOrStartTest = async () => {
        if (!testSeriesId) return;
        setLoading(true);
        setGlobalError(null);

        try {
            const res = await api.post("/test/start", { testSeriesId });
            const data = res.data;

            if (!data.success) throw new Error(data.message || "Failed to start test");

            setSessionId(data.sessionId);
            setTestSeries(data.testSeries);
            setSections(data.sections || []);

            if (data.testSeries.type === "Full-Length") {
                const inProgressIndex = (data.sections || []).findIndex(
                    (s: SectionDTO) => s.status === "in_progress"
                );

                if (inProgressIndex !== -1) {
                    setActiveSectionIndex(inProgressIndex);
                    setViewMode("sections");
                } else {
                    setViewMode("sections");
                }
            } else {
                const question: QuestionDTO | null = data.currentQuestion || null;
                const progressData: ProgressDTO | null = data.progress || null;
                const userAnswer: UserAnswerItem[] | null = data.userAnswer || null;
                const numberingData: NumberingDTO | null = data.numbering || null;

                if (question && progressData) {
                    hydrateQuestionState(
                        question,
                        progressData,
                        userAnswer || [],
                        numberingData || undefined
                    );
                    if (data.timeRemaining != null) {
                        setSectionTimeLeft(data.timeRemaining);
                    }
                    setViewMode("question");
                }
            }
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrStartTest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testSeriesId]);

    // ---------- Timer ----------
    useEffect(() => {
        if (sectionTimeLeft == null) return;
        if (sectionTimeLeft <= 0) {
            return;
        }

        const id = setTimeout(() => {
            setSectionTimeLeft((prev) => (prev != null ? prev - 1 : prev));
        }, 1000);

        return () => clearTimeout(id);
    }, [sectionTimeLeft]);



    const fixAudioUrl = (url: string): string => {
        if (!url) return '';

        console.log("🔊 Original URL from database:", url);


        let fixedUrl = url.replace(/\\/g, '/');


        fixedUrl = fixedUrl.replace(/\/\//g, '/');

        // 3. IMPORTANT: Production server URL add करें
        const baseUrl = 'https://uat.gatewayabroadeducations.com';


        if (fixedUrl.startsWith('/')) {
            return baseUrl + fixedUrl;
        } else {
            return baseUrl + '/' + fixedUrl;
        }
    };



    // ---------- Helpers ----------
    const buildDefaultValuesFromQuestion = (
        question: QuestionDTO,
        userAnswers: UserAnswerItem[] | null | undefined
    ): QuestionFormValues => {
        const answers: Record<string, any> = {};
        const answerMap: Record<string, any> = {};

        (userAnswers || []).forEach((ua) => {
            if (ua.questionId) {
                answerMap[ua.questionId] = ua.answer;
            }
        });

        if (question.isQuestionGroup && question.questionGroup?.length) {
            for (const group of question.questionGroup) {
                for (const sub of group.questions) {
                    // Only for summary_completion and note_completion
                    if (group.type === "summary_completion" || group.type === "note_completion") {
                        const placeholderCount = (sub.question.match(/\{\{\d+\}\}/g) || []).length;
                        const backendAnswer = answerMap[sub._id];

                        if (backendAnswer !== undefined && placeholderCount > 0) {
                            if (Array.isArray(backendAnswer)) {
                                backendAnswer.forEach((ans, idx) => {
                                    const fieldName = `${sub._id}_${idx + 1}`;
                                    answers[fieldName] = ans;
                                });
                            } else if (typeof backendAnswer === 'string' && backendAnswer.includes('|')) {
                                const splitAnswers = backendAnswer.split('|').map(s => s.trim());
                                splitAnswers.forEach((ans, idx) => {
                                    const fieldName = `${sub._id}_${idx + 1}`;
                                    answers[fieldName] = ans;
                                });
                            } else {
                                const fieldName = `${sub._id}_1`;
                                answers[fieldName] = backendAnswer;
                            }
                        } else {
                            for (let i = 1; i <= placeholderCount; i++) {
                                const fieldName = `${sub._id}_${i}`;
                                answers[fieldName] = "";
                            }
                        }
                    } else {
                        answers[sub._id] = answerMap[sub._id] ?? (group.type === "multiple_choice_multiple" ? [] : "");
                    }
                }
            }
        } else {
            if (question.questionType === "summary_completion" || question.questionType === "note_completion") {
                const questionText = question.content.passageText || question.content.instruction;
                const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
                const backendAnswer = answerMap[question._id];

                if (backendAnswer !== undefined && placeholderCount > 0) {
                    if (Array.isArray(backendAnswer)) {
                        backendAnswer.forEach((ans, idx) => {
                            const fieldName = `${question._id}_${idx + 1}`;
                            answers[fieldName] = ans;
                        });
                    } else if (typeof backendAnswer === 'string' && backendAnswer.includes('|')) {
                        const splitAnswers = backendAnswer.split('|').map(s => s.trim());
                        splitAnswers.forEach((ans, idx) => {
                            const fieldName = `${question._id}_${idx + 1}`;
                            answers[fieldName] = ans;
                        });
                    } else {
                        const fieldName = `${question._id}_1`;
                        answers[fieldName] = backendAnswer;
                    }
                } else {
                    for (let i = 1; i <= placeholderCount; i++) {
                        const fieldName = `${question._id}_${i}`;
                        answers[fieldName] = "";
                    }
                }
            } else {
                const defaultVal = question.questionType === "multiple_choice_multiple" ? [] : "";
                answers[question._id] = answerMap[question._id] ?? defaultVal;
            }
        }

        return { answers };
    };

    const hydrateQuestionState = (
        question: QuestionDTO,
        progressData: ProgressDTO,
        userAnswers?: UserAnswerItem[] | null,
        numberingData?: NumberingDTO | null
    ) => {
        setCurrentQuestion(question);
        setProgress(progressData);
        if (numberingData) setNumbering(numberingData);

        const defaults = buildDefaultValuesFromQuestion(question, userAnswers || []);
        reset(defaults);
        questionStartRef.current = Date.now();
    };

   const startSpeakingSection = () => {
  if (currentQuestion && progress) {
    setShowVoiceVerification(false);
    setViewMode("question");
  
  }
};

   const handleStartSection = async (sectionIndex: number) => {
    if (!sessionId) return;
    setGlobalError(null);

    try {
        const res = await api.post(`/test/session/${sessionId}/start-section`, {
            sectionIndex,
        });

        const data = res.data;
        if (!data.success) throw new Error(data.message || "Failed to start section");

        setActiveSectionIndex(sectionIndex);

        const currentQuestion: QuestionDTO = data.currentQuestion;

        // Check if speaking section
        const section = sections[sectionIndex];
        let sectionName = "";
        if (section) {
            if (typeof section.sectionId === "object") {
                sectionName = (section.sectionId as any).name || "";
            } else {
                sectionName = String(section.sectionId);
            }
        }

        const isSpeaking = sectionName.toLowerCase().includes("speaking") ||
            isSpeakingType(currentQuestion.questionType);

        if (isSpeaking) {
          
            // setShowVoiceVerification(true);
         
            // setCurrentQuestion(currentQuestion);
            // setProgress(data.progress);
             setViewMode("question");
             hydrateQuestionState(currentQuestion, data.progress, null, null);
            if (data.sectionTimeRemaining != null) {
                setSectionTimeLeft(data.sectionTimeRemaining);
            }
            // ✅ YEH LINE ADD KARO - Speaking section will be shown after voice verification
            // No need to set viewMode here, VoiceVerification will handle it
        } else {
            // Non-speaking section - direct to question
            setViewMode("question");
            hydrateQuestionState(currentQuestion, data.progress, null, null);
            if (data.sectionTimeRemaining != null) {
                setSectionTimeLeft(data.sectionTimeRemaining);
            }
        }
    } catch (err: any) {
        console.error(err);
        setGlobalError(err.response?.data?.message || err.message || "Fail to start section");
    }
};

    // ---------- Submit answer ----------
    const sendAnswerAndGoNext = async (values: QuestionFormValues) => {
    if (!sessionId || !currentQuestion || !progress) return;

    setGlobalError(null);

    const now = Date.now();
    const timeSpent =
        questionStartRef.current != null
            ? Math.max(1, Math.round((now - questionStartRef.current) / 1000))
            : 0;

    const rawAnswers = values.answers || {};
    const answersPayload: UserAnswerItem[] = [];

    const isSpeakingQuestion = isSpeakingType(currentQuestion.questionType);
    
    if (isSpeakingQuestion) {
        // Handle speaking answers differently
        Object.entries(rawAnswers).forEach(([questionId, answer]) => {
            if (answer && (typeof answer === 'string' || answer.audioUrl)) {
                answersPayload.push({
                    questionId: questionId,
                    answer: typeof answer === 'string' ? answer : answer.audioUrl
                });
            }
        });
    }
  

    // Existing code for other question types
    else if (currentQuestion.isQuestionGroup && currentQuestion.questionGroup?.length) {
        for (const group of currentQuestion.questionGroup) {
            for (const sub of group.questions) {
                if (group.type === "summary_completion" || group.type === "note_completion") {
                    const placeholderCount = (sub.question.match(/\{\{\d+\}\}/g) || []).length;
                    const subQuestionAnswers: string[] = [];

                    for (let i = 1; i <= placeholderCount; i++) {
                        const fieldName = `${sub._id}_${i}`;
                        const answer = rawAnswers[fieldName];
                        if (answer && answer.trim() !== "") {
                            subQuestionAnswers.push(answer.trim());
                        }
                    }

                    if (subQuestionAnswers.length > 0) {
                        answersPayload.push({
                            questionGroupId: group._id,
                            questionId: sub._id,
                            answer: subQuestionAnswers
                        });
                    }
                } else {
                    const answer = rawAnswers[sub._id];
                    if (answer !== null && answer !== undefined && answer !== "" &&
                        !(Array.isArray(answer) && answer.length === 0)) {
                        answersPayload.push({
                            questionGroupId: group._id,
                            questionId: sub._id,
                            answer: answer
                        });
                    }
                }
            }
        }
    } else if (currentQuestion.questionType === "summary_completion" || currentQuestion.questionType === "note_completion") {
        const questionText = currentQuestion.content.passageText || currentQuestion.content.instruction;
        const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
        const questionAnswers: string[] = [];

        for (let i = 1; i <= placeholderCount; i++) {
            const fieldName = `${currentQuestion._id}_${i}`;
            const answer = rawAnswers[fieldName];
            if (answer && answer.trim() !== "") {
                questionAnswers.push(answer.trim());
            }
        }

        if (questionAnswers.length > 0) {
            answersPayload.push({
                questionId: currentQuestion._id,
                answer: questionAnswers
            });
        }
    } else {
        Object.entries(rawAnswers)
            .filter(([, val]) => val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0))
            .forEach(([questionId, answer]) => {
                answersPayload.push({ questionId, answer });
            });
    }

    // Rest of the existing code...
    try {
        const res = await api.post(`/test/session/${sessionId}/submit`, {
            answers: answersPayload,
            timeSpent,
            lastQuestionIndex: progress.currentQuestion ?? 0,
        });

        const data = res.data;
        if (!data.success) throw new Error(data.message || "Failed to submit answer");

        if (data.isTestCompleted && data.analysis) {
            setAnalysis(data.analysis);
            setViewMode("result");
            return;
        }

        if (data.sectionCompleted && data.sections) {
            setSections(data.sections);
            setActiveSectionIndex(null);
            setCurrentQuestion(null);
            setProgress(null);
            setNumbering(null);
            setSectionTimeLeft(null);
            setViewMode("sections");
            return;
        }

        const nextQuestion: QuestionDTO = data.currentQuestion;
        const progressData: ProgressDTO = data.progress;
        const userAnswer: UserAnswerItem[] | null = data.userAnswer || null;
        const numberingData: NumberingDTO | null = data.numbering || null;

        hydrateQuestionState(nextQuestion, progressData, userAnswer, numberingData || undefined);
    } catch (err: any) {
        console.error(err);
        setGlobalError(err.response?.data?.message || err.message || "Failed to submit answer");
    }
};



    // ========== NUMBERING LOGIC HELPER FUNCTIONS ==========

    // Get all questions (flattened)
    const getAllQuestions = (): (QuestionGroup['questions'][0] | QuestionDTO)[] => {
        if (!currentQuestion) return [];

        if (currentQuestion.isQuestionGroup && currentQuestion.questionGroup?.length) {
            return currentQuestion.questionGroup.flatMap(group => group.questions || []);
        }

        return [currentQuestion];
    };

    // Get question text from any question object
    const getQuestionText = (question: any): string => {
        if (!question) return '';

        // For SubQuestion
        if (question.question) return question.question;

        // For QuestionDTO
        if (question.content?.passageText) return question.content.passageText;
        if (question.content?.instruction) return question.content.instruction;

        return '';
    };

    // Get question type for a specific question
    const getQuestionType = (question: any, questionIndex: number): string => {
        if (!currentQuestion) return '';

        // If it's a question group
        if (currentQuestion.isQuestionGroup && currentQuestion.questionGroup?.length) {
            let currentIdx = 0;
            for (const group of currentQuestion.questionGroup) {
                const groupQuestions = group.questions || [];
                if (questionIndex >= currentIdx && questionIndex < currentIdx + groupQuestions.length) {
                    return group.type;
                }
                currentIdx += groupQuestions.length;
            }
        }

        // Single question
        return currentQuestion.questionType;
    };

    // Calculate starting question number (this is the core logic)
    const calculateQuestionStartingNumber = (questionIndex: number): number => {
        if (!numbering) {
            return questionIndex + 1;
        }

        const { firstSectionQuestionNumber } = numbering;
        let currentNumber = firstSectionQuestionNumber;

        // Get all questions
        const allQuestions = getAllQuestions();

        // Count previous questions based on their type
        for (let i = 0; i < questionIndex; i++) {
            const question = allQuestions[i];
            if (!question) continue;

            const questionText = getQuestionText(question);
            const questionType = getQuestionType(question, i);

            // Handle summary/note completion (multiple placeholders)
            if (questionType === "summary_completion" || questionType === "note_completion") {
                const placeholderCount = (questionText.match(/\{\{(\d+)\}\}/g) || []).length;
                currentNumber += placeholderCount;
            }
            // Handle multiple choice with TWO answers
            else if (questionType === "multiple_choice_multiple" &&
                (questionText?.includes('TWO') ||
                    questionText?.includes('10-11') ||
                    questionText?.includes('12-13'))) {
                currentNumber += 2;
            }
            // Handle regular questions
            else {
                currentNumber += 1;
            }
        }

        return currentNumber;
    };

    // Calculate how many question numbers this question will take
    const getQuestionNumberCount = (question: any, questionIndex: number): number => {
        const questionText = getQuestionText(question);
        const questionType = getQuestionType(question, questionIndex);

        // Handle summary/note completion
        if (questionType === "summary_completion" || questionType === "note_completion") {
            const placeholderCount = (questionText.match(/\{\{(\d+)\}\}/g) || []).length;
            return placeholderCount;
        }
        // Handle multiple choice with TWO answers
        else if (questionType === "multiple_choice_multiple" &&
            (questionText?.includes('TWO') ||
                questionText?.includes('10-11') ||
                questionText?.includes('12-13'))) {
            return 2;
        }
        // Handle regular questions
        else {
            return 1;
        }
    };

    // Get question number display text
    const getQuestionNumberDisplay = (questionIndex: number): string => {
        const startNumber = calculateQuestionStartingNumber(questionIndex);
        const allQuestions = getAllQuestions();
        const question = allQuestions[questionIndex];
        const count = getQuestionNumberCount(question, questionIndex);

        if (count > 1) {
            return `${startNumber}-${startNumber + count - 1}`;
        }
        return startNumber.toString();
    };

    // Check if question has placeholders
    const hasPlaceholders = (questionText: string): boolean => {
        return questionText?.includes('{{') || false;
    };

    // ---------- Previous question ----------
    const goToPreviousQuestion = async () => {
        if (!sessionId) return;
        setGlobalError(null);

        try {
            const res = await api.get(`/test/session/${sessionId}/previous`);
            const data = res.data;

            if (!data.success) throw new Error(data.message || "Failed to load previous question");

            const question: QuestionDTO = data.currentQuestion;
            const progressData: ProgressDTO = data.progress;
            const userAnswer: UserAnswerItem[] | null = data.userAnswer || null;
            const numberingData: NumberingDTO | null = data.numbering || null;

            hydrateQuestionState(question, progressData, userAnswer, numberingData || undefined);
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Failed to load previous");
        }
    };

    // ---------- Submit whole test ----------
    const handleSubmitTest = async () => {
        if (!sessionId) return;
        setGlobalError(null);

        try {
            const res = await api.post(`/test/${sessionId}/submit`);
            const data = res.data;

            if (!data.success) throw new Error(data.message || "Failed to submit test");

            setAnalysis(data.analysis);
            setViewMode("result");
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Failed to submit test");
        }
    };

    // ---------- Derived UI values ----------
    const questionLabel = useMemo(() => {
        if (numbering) {
            const { questionCount, firstGlobalQuestionNumber, totalGlobalQuestions } = numbering;
            if (questionCount > 1) {
                return `Questions ${firstGlobalQuestionNumber}–${firstGlobalQuestionNumber + questionCount - 1} of ${totalGlobalQuestions}`;
            }
            return `Question ${firstGlobalQuestionNumber} of ${totalGlobalQuestions}`;
        }
        if (progress) {
            return `Question ${progress.questionsAnswered + 1} of ${progress.totalQuestions}`;
        }
        return "Question";
    }, [numbering, progress]);




    const renderSummaryWithInputs = (
        questionHtml: string,
        fieldName: string,
        startNumber: number // Change to number
    ) => {
        if (!questionHtml) return null;

        const parts = [];
        const regex = /\{\{(\d+)\}\}/g;
        let lastIndex = 0;
        let match;
        let index = 0;
        let placeholderCount = 0;

        // Use startNumber directly
        const baseNumber = startNumber;

        while ((match = regex.exec(questionHtml)) !== null) {
            if (match.index > lastIndex) {
                const htmlPart = questionHtml.slice(lastIndex, match.index);
                parts.push(
                    <span
                        key={`text-${index}`}
                        dangerouslySetInnerHTML={{ __html: htmlPart }}
                    />
                );
                index++;
            }

            const placeholderIndex = match[1];
            const subQuestionId = `${fieldName}_${placeholderIndex}`;

            // Correct numbering: baseNumber + placeholderCount
            const numberToShow = baseNumber + placeholderCount;

            parts.push(
                <span key={`input-${index}`} className="inline-flex items-center gap-2 mx-1">
                    {/* Number Bubble */}
                    <span className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-semibold">
                        {numberToShow}
                    </span>

                    {/* Input */}
                    <input
                        type="text"
                        {...register(`answers.${subQuestionId}` as const)}
                        placeholder="Answer"
                        className="border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 rounded-lg outline-none 
                            transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                            dark:border-gray-500 dark:bg-gray-600 dark:text-white 
                            dark:focus:border-blue-400 dark:focus:ring-blue-900/30 
                            min-w-[120px] text-center"
                    />
                </span>
            );

            placeholderCount++;
            index++;
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < questionHtml.length) {
            const htmlPart = questionHtml.slice(lastIndex);
            parts.push(
                <span
                    key={`text-${index}`}
                    dangerouslySetInnerHTML={{ __html: htmlPart }}
                />
            );
        }

        return parts;
    };





    const updateCurrentTimeDisplay = (audioElement) => {
        if (!audioElement) return;

        const formatTime = (seconds) => {
            if (isNaN(seconds)) return "0:00";
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };

        // Update time displays
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');

        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(audioElement.currentTime);
        }

        if (durationEl) {
            durationEl.textContent = formatTime(audioElement.duration || 0);
        }

        // Update progress fill
        const progressFill = document.getElementById('progress-fill');
        const progressInput = document.getElementById('audio-progress');

        if (progressFill && progressInput && audioElement.duration) {
            const progress = (audioElement.currentTime / audioElement.duration) * 100;
            progressFill.style.width = `${progress}%`;
            progressInput.value = progress;
        }
    };



    const renderQuestionWithDropdowns = (
        questionText: string,
        fieldName: string,
        startNumber: number,
        commonOptions?: string[] | string
    ) => {
        const optionsArray = commonOptions
            ? (typeof commonOptions === 'string'
                ? commonOptions.split(',').map(opt => opt.trim())
                : commonOptions)
            : [];

        // Check if question contains image
        const hasImage = questionText.includes('<img');

        // Extract image tag if present
        const imageMatch = questionText.match(/<img[^>]+src="([^">]+)"[^>]*>/);

        if (hasImage && imageMatch) {
            // For diagram labelling with image
            const imageSrc = imageMatch[1];
            const parts = questionText.split(/<img[^>]+>/);

            return (
                <div className="space-y-6">
                    {/* Image section */}
                    <div className="flex justify-center">
                        <img
                            src={imageSrc}
                            alt="Diagram"
                            className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                    </div>

                    {/* Questions section */}
                    <div className="space-y-4">
                        {(() => {
                            // Extract questions from remaining text
                            const remainingText = parts[1] || '';
                            const questionLines = remainingText.split(/<p>|<\/p>/).filter(line => line.trim());

                            return questionLines.map((line, lineIndex) => {
                                const placeholders = line.match(/\{\{(\d+)\}\}/g) || [];

                                if (placeholders.length === 0) {
                                    return (
                                        <p
                                            key={lineIndex}
                                            className="text-gray-700 dark:text-gray-300"
                                            dangerouslySetInnerHTML={{ __html: line }}
                                        />
                                    );
                                }

                                return (
                                    <div key={lineIndex} className="flex items-center gap-3">
                                        <div className="flex-1 text-gray-700 dark:text-gray-300">
                                            {line.split(/(\{\{\d+\}\})/).map((part, partIndex) => {
                                                const match = part.match(/\{\{(\d+)\}\}/);
                                                if (match) {
                                                    const placeholderNumber = parseInt(match[1]);
                                                    const currentQuestionNumber = startNumber + placeholderNumber - 1;

                                                    return (
                                                        <span key={partIndex} className="inline-flex items-center mx-1">
                                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold mr-2">
                                                                {currentQuestionNumber}
                                                            </span>
                                                            <select
                                                                {...register(`answers.${fieldName}_${placeholderNumber}` as const)}
                                                                className="min-w-[100px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                                                            >
                                                                <option value="">Select</option>
                                                                {optionsArray.map((option, idx) => (
                                                                    <option key={idx} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span
                                                        key={partIndex}
                                                        dangerouslySetInnerHTML={{ __html: part }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                        Choose from options: {optionsArray.join(', ')}
                    </p>
                </div>
            );
        }

        // Regular text-based questions
        // Split text and placeholders
        const regex = /\{\{(\d+)\}\}/g;
        const textParts = [];
        let lastIndex = 0;
        let match;
        let questionIndex = 0;

        while ((match = regex.exec(questionText)) !== null) {
            // Add text before placeholder
            if (match.index > lastIndex) {
                const htmlPart = questionText.slice(lastIndex, match.index);
                textParts.push(
                    <span
                        key={`text-${textParts.length}`}
                        dangerouslySetInnerHTML={{ __html: htmlPart }}
                    />
                );
            }

            // Add placeholder with dropdown
            const placeholderNumber = parseInt(match[1]);
            const currentQuestionNumber = startNumber + placeholderNumber - 1;

            textParts.push(
                <span key={`dropdown-${textParts.length}`} className="inline-flex items-center mx-1">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold mr-2">
                        {currentQuestionNumber}
                    </span>
                    <select
                        {...register(`answers.${fieldName}_${placeholderNumber}` as const)}
                        className="min-w-[100px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                    >
                        <option value="">Select</option>
                        {optionsArray.map((option, idx) => (
                            <option key={idx} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </span>
            );

            lastIndex = regex.lastIndex;
        }

        // Add remaining text after last placeholder
        if (lastIndex < questionText.length) {
            const htmlPart = questionText.slice(lastIndex);
            textParts.push(
                <span
                    key={`text-${textParts.length}`}
                    dangerouslySetInnerHTML={{ __html: htmlPart }}
                />
            );
        }

        return (
            <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
                    <div className="text-gray-900 dark:text-white text-lg leading-relaxed">
                        {textParts}
                    </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    {commonOptions ?
                        `Choose from options: ${optionsArray.join(', ')}` :
                        "Select the correct options"}
                </p>
            </div>
        );
    };








    // ---------- Answer field renderers ----------
    const renderAnswerField = (
        fieldName: string,
        questionType: string,
        options?: QuestionOption[],
        questionText?: string,
        commonOptions?: string[] | string,
        questionIndex?: number // Add question index parameter
    ) => {


        // Calculate starting number for this question
        const startNumber = questionIndex !== undefined ? calculateQuestionStartingNumber(questionIndex) : 1;





        // Matching, Pick from List, Classification, Diagram Labelling, etc.
        if (["matching", "pick_from_a_list", "classification",
            "diagram_labelling", "matching_sentence_endings",
            "classification_reading"].includes(questionType) && questionText) {

            return renderQuestionWithDropdowns(
                questionText,
                fieldName,
                startNumber,
                commonOptions
            );
        }






        // Summary Completion
        if (questionType === "summary_completion") {


            if (!questionText) {
                return <div className="text-red-500">No question text provided for summary completion</div>;
            }

            return (
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
                        <div className="text-gray-900 dark:text-white text-lg leading-relaxed">
                            {renderSummaryWithInputs(questionText, fieldName, startNumber)}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Complete the summary using words from the text
                    </p>
                </div>
            );
        }

        // Note Completion
        if (questionType === "note_completion") {


            if (!questionText) {
                return <div className="text-red-500">No question text provided for note completion</div>;
            }

            return (
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
                        <div className="text-gray-900 dark:text-white text-lg leading-relaxed">
                            {renderSummaryWithInputs(questionText, fieldName, startNumber)}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Write ONE WORD AND/OR A NUMBER for each answer
                    </p>
                </div>
            );
        }

        // Matching Features
        if (questionType === "matching_features" && commonOptions) {
            const optionsArray = typeof commonOptions === 'string'
                ? commonOptions.split(',').map(opt => opt.trim())
                : commonOptions;

            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">


                    </div>
                    <select
                        {...register(`answers.${fieldName}` as const)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900/30"
                    >
                        <option value="">Select an option</option>
                        {optionsArray.map((option, idx) => (
                            <option key={idx} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Choose the correct option from the list
                    </p>
                </div>
            );
        }

        // Matching Information
        if (questionType === "matching_information" && commonOptions) {
            const optionsArray = typeof commonOptions === 'string'
                ? commonOptions.split(',').map(opt => opt.trim())
                : commonOptions;

            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">


                    </div>
                    <select
                        {...register(`answers.${fieldName}` as const)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900/30"
                    >
                        <option value="">Select an option</option>
                        {optionsArray.map((option, idx) => (
                            <option key={idx} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Match the information to the correct option
                    </p>
                </div>
            );
        }

        // MCQ single choice with numbering
        if (questionType === "multiple_choice_single" && options?.length) {
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">


                    </div>
                    {options.map((opt, idx) => (
                        <label
                            key={idx}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                        >
                            <input
                                type="radio"
                                value={opt.label || opt.text}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                {...register(`answers.${fieldName}` as const)}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {opt.label && <span className="mr-2 font-bold">{opt.label}.</span>}
                                {opt.text}
                            </span>
                        </label>
                    ))}
                </div>
            );
        }

        // MCQ multiple choice with range display for TWO answers
        if (questionType === "multiple_choice_multiple" && options?.length) {
            // Check if it's a TWO answers question
            const isTwoAnswersQuestion = questionText?.includes('TWO') ||
                questionText?.includes('10-11') ||
                questionText?.includes('12-13');

            let questionNumberDisplay;
            if (isTwoAnswersQuestion) {
                questionNumberDisplay = `Questions ${startNumber}-${startNumber + 1}`;
            } else {
                questionNumberDisplay = `Question ${startNumber}`;
            }

            return (
                <Controller
                    control={control}
                    name={`answers.${fieldName}` as const}
                    defaultValue={[]}
                    render={({ field }) => {
                        const value: string[] = field.value || [];
                        const toggle = (val: string) => {
                            if (value.includes(val)) {
                                field.onChange(value.filter((v) => v !== val));
                            } else {
                                field.onChange([...value, val]);
                            }
                        };

                        return (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">


                                    {isTwoAnswersQuestion && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded dark:bg-yellow-900 dark:text-yellow-200">
                                            Choose TWO letters
                                        </span>
                                    )}
                                </div>

                                {options.map((opt, idx) => {
                                    const val = opt.label || opt.text;
                                    const checked = value.includes(val);
                                    return (
                                        <label
                                            key={idx}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${checked
                                                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                                                : "border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                                                checked={checked}
                                                onChange={() => toggle(val)}
                                            />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {opt.label && <span className="mr-2 font-bold">{opt.label}.</span>}
                                                {opt.text}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        );
                    }}
                />
            );
        }

        // True/False/Not Given & Yes/No/Not Given with numbering
        if (["true_false_not_given", "yes_no_not_given"].includes(questionType)) {
            const choices =
                questionType === "true_false_not_given"
                    ? ["True", "False", "Not Given"]
                    : ["Yes", "No", "Not Given"];
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">


                    </div>
                    <div className="flex flex-wrap gap-3">
                        {choices.map((c) => (
                            <label
                                key={c}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                            >
                                <input
                                    type="radio"
                                    value={c}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    {...register(`answers.${fieldName}` as const)}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{c}</span>
                            </label>
                        ))}
                    </div>
                </div>
            );
        }

        // Short answer / sentence completion with numbering
        if (["short_answer", "sentence_completion"].includes(questionType)) {
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold">
                            {startNumber}
                        </span>

                    </div>
                    <input
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900/30"
                        placeholder="Type your answer here..."
                        {...register(`answers.${fieldName}` as const)}
                    />
                </div>
            );
        }

        // Generic textarea (writing or other) with numbering
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-semibold">
                        {startNumber}
                    </span>

                </div>
                <textarea
                    rows={6}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900/30"
                    placeholder="Type your detailed answer here..."
                    {...register(`answers.${fieldName}` as const)}
                />
            </div>
        );
    };

















    // ---------- Views ----------
    const renderSectionsView = () => {
        if (!testSeries) return null;
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <button
                            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => window.history.back()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                            {testSeries.title}
                        </h1>
                        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                            Full-Length Test • {testSeries.totalQuestions} questions • {testSeries.duration} minutes
                        </p>
                    </div>

                    {/* Progress Summary */}
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sections</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{testSeries.totalSections}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-green-100 p-2 dark:bg-green-900/30">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {sections.filter(s => s.status === "completed").length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-amber-100 p-2 dark:bg-amber-900/30">
                                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Duration</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{testSeries.duration}m</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sections Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sections.map((sec) => {
                            const isObj = typeof sec.sectionId === "object";
                            const secName = isObj ? (sec.sectionId as any).name : String(sec.sectionId);
                            const secDesc = isObj ? (sec.sectionId as any).description : "Test section";
                            const canStart = sec.status !== "completed";
                            const statusBadge = getSectionStatusBadge(sec.status);

                            return (
                                <div
                                    key={sec.index}
                                    className="group rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400"
                                >
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            Section {sec.index + 1}
                                        </div>
                                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadge}`}>
                                            {sec.status === "completed" ? "Completed" : sec.status === "in_progress" ? "In Progress" : "Not Started"}
                                        </span>
                                    </div>

                                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{secName}</h3>

                                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{secDesc}</p>

                                    <div className="mb-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {sec.duration} min
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <HelpCircle className="h-4 w-4" />
                                            {sec.totalQuestions} questions
                                        </span>
                                    </div>

                                    <Button
                                        size="lg"
                                        className={`w-full ${sec.status === "completed"
                                            ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                            }`}
                                        disabled={!canStart}
                                        onClick={() => handleStartSection(sec.index)}
                                    >
                                        {sec.status === "not_started" ? "Start Section" : "Continue Section"}
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {globalError && (
                        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">{globalError}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderQuestionView = () => {
       

      

 if (!testSeries || !currentQuestion || !progress) return null;

    const canGoPrevious = !(progress.currentSection === 1 && progress.currentQuestion === 1);
    const mainQuestionType = currentQuestion.questionType;
  
    const showListeningLayout = isListeningType(mainQuestionType) || !!currentQuestion.content.audioUrl;



        const showWritingLayout = isWritingType(mainQuestionType);

   const showSpeakingLayout = detectSpeakingQuestion(currentQuestion);
    
    console.log("🎤 FINAL SPEAKING DETECTION RESULT:", {
        showSpeakingLayout,
        questionData: {
            id: currentQuestion._id,
            title: currentQuestion.title,
            category: currentQuestion.questionCategory,
            hasCueCard: !!currentQuestion.cueCard,
            questionGroups: currentQuestion.questionGroup?.length,
            groupTypes: currentQuestion.questionGroup?.map(g => g.type)
        }
    });

    if (showSpeakingLayout) {
        console.log("✅ SPEAKING SECTION CONFIRMED!");
        
        // Prepare speaking question data
        const speakingQuestionData = {
            _id: currentQuestion._id,
            title: currentQuestion.title || "Speaking Test",
            exam: currentQuestion.exam || "ielts",
            sectionId: currentQuestion.sectionId || "",
            questionCategory: currentQuestion.questionCategory || "speaking",
            marks: currentQuestion.marks || 1,
            isQuestionGroup: currentQuestion.isQuestionGroup,
            questionGroup: currentQuestion.questionGroup || [],
            totalQuestions: currentQuestion.totalQuestions || 0,
            difficulty: currentQuestion.difficulty || "medium",
            content: {
                instruction: currentQuestion.content.instruction || "",
                passageTitle: currentQuestion.content.passageTitle || "",
                passageText: currentQuestion.content.passageText || "",
                transcript: currentQuestion.content.transcript || "",
                imageUrl: currentQuestion.content.imageUrl || "",
                audioUrl: currentQuestion.content.audioUrl || "",
                videoUrl: currentQuestion.content.videoUrl || ""
            },
            cueCard: currentQuestion.cueCard || { prompts: [] },
            tags: currentQuestion.tags || [],
            timeLimit: currentQuestion.timeLimit || 5,
            isActive: currentQuestion.isActive !== false,
            options: currentQuestion.options || [],
            createdAt: currentQuestion.createdAt || new Date().toISOString(),
            updatedAt: currentQuestion.updatedAt || new Date().toISOString(),
            __v: 0
        };

        // Calculate total questions if not provided
        if (!speakingQuestionData.totalQuestions && speakingQuestionData.questionGroup?.length > 0) {
            speakingQuestionData.totalQuestions = speakingQuestionData.questionGroup.reduce(
                (total, group) => total + (group.questions?.length || 0), 0
            );
        }

        console.log("🎤 Prepared Speaking Data:", {
            totalQuestions: speakingQuestionData.totalQuestions,
            questionGroups: speakingQuestionData.questionGroup?.length,
            groupDetails: speakingQuestionData.questionGroup?.map(g => ({
                title: g.title,
                questions: g.questions?.length
            }))
        });

        // Show speaking section
        return (
            <SpeakingTestSection
                question={speakingQuestionData}
                progress={{
                    currentSection: progress.currentSection,
                    totalSections: progress.totalSections,
                    currentQuestion: progress.currentQuestion,
                    questionsAnswered: progress.questionsAnswered,
                    totalQuestions: progress.totalQuestions,
                    completionPercentage: progress.completionPercentage
                }}
                onBack={() => {
                    setViewMode("sections");
                    setActiveSectionIndex(null);
                    setCurrentQuestion(null);
                    setProgress(null);
                }}
                onSubmit={async (speakingAnswers) => {
                    console.log("🎤 Submitting speaking answers:", speakingAnswers);
                    
                    const values: QuestionFormValues = {
                        answers: {}
                    };
                    
                    // Convert speaking answers to format expected by sendAnswerAndGoNext
                    speakingAnswers.forEach((answer) => {
                        if (answer.audioUrl) {
                            values.answers[answer.questionId] = answer.audioUrl;
                        }
                    });
                    
                    try {
                        await sendAnswerAndGoNext(values);
                    } catch (error) {
                        console.error("Error submitting speaking answers:", error);
                    }
                }}
                onRecord={async (action: "start" | "stop", questionId?: string) => {
                    console.log("🎤 Recording action:", action, "for question:", questionId);
                    
                    if (questionId) {
                        setCurrentQuestionId(questionId);
                    }
                    
                    if (action === "start") {
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            const mediaRecorder = new MediaRecorder(stream);
                            mediaRecorderRef.current = mediaRecorder;
                            const chunks: BlobPart[] = [];

                            mediaRecorder.ondataavailable = (e) => {
                                chunks.push(e.data);
                            };

                            mediaRecorder.onstop = () => {
                                const blob = new Blob(chunks, { type: "audio/webm" });
                                const url = URL.createObjectURL(blob);
                                setRecordedUrl(url);
                            };

                            mediaRecorder.start();
                            setRecording(true);
                        } catch (e) {
                            console.error("Unable to access microphone", e);
                            setGlobalError("Could not access microphone. Check permissions.");
                        }
                    } else {
                        if (mediaRecorderRef.current) {
                            mediaRecorderRef.current.stop();
                            setRecording(false);
                        }
                    }
                }}
                recording={recording}
                recordedUrl={recordedUrl}
                currentQuestionId={currentQuestionId}
            />
        );
    }



        return (
            <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
                {/* Top Navigation Bar */}
                <header className="bg-[#bcdaff] border-b border-gray-200  backdrop-blur-sm dark:border-gray-700 ">
                    <div className="mx-auto max-w-7xl px-4 py-1  ">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">

                                <div className="hidden sm:block">
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{testSeries.title}</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Section {progress.currentSection} of {progress.totalSections}
                                    </p>
                                </div>
                            </div>
                            {/* Timer */}
                            <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-2 dark:bg-red-900/20">
                                <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <div className="text-center">
                                    <div className="text-xs font-medium text-red-600 dark:text-red-400">Time Left</div>
                                    <div className="text-lg font-bold text-red-700 dark:text-red-300">
                                        {formatSeconds(sectionTimeLeft ?? null)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">





                            </div>
                        </div>
                    </div>
                </header>


                {/* Main Content */}
                <main className="flex-1 px-4 py-4">
                    <div className="mx-auto w-full max-w-full">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Left Panel - Passage/Instructions - 50% width */}
                            <div className="lg:col-span-1">
                                <div className="h-[525px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 
    /* Hide scrollbar but keep scroll functionality */
    overflow-y-scroll 
    [-ms-overflow-style:none]  /* IE and Edge */
    [scrollbar-width:none]  /* Firefox */
    /* For Chrome, Safari and Opera */
    [&::-webkit-scrollbar]:hidden">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reading Passage</h3>
                                        <button
                                            onClick={() => handleSpeak(currentQuestion.content.passageText || currentQuestion.content.instruction)}
                                            className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                        >
                                            <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {showWritingLayout && (
                                        <div className="mt-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                                            <div
                                                className="text-sm text-blue-800 dark:text-blue-200 [&_img]:max-w-full [&_img]:max-h-[400px] [&_img]:object-contain [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-300 [&_img]:dark:border-gray-600 [&_img]:my-3 [&_img]:mx-auto"
                                                dangerouslySetInnerHTML={{
                                                    __html: currentQuestion.content.instruction
                                                }}
                                            />
                                        </div>
                                    )}

                                    {showListeningLayout && currentQuestion.content.audioUrl && (
                                        <div className="mb-6 rounded-2xl border p-6 shadow-lg"
                                            style={{
                                                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                                borderColor: '#e2e8f0'
                                            }}>

                                            {/* Header */}
                                            <div className="mb-6 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                                                            borderRadius: '9999px',
                                                            filter: 'blur(12px)',
                                                            opacity: 0.3
                                                        }}></div>
                                                        <div style={{
                                                            position: 'relative',
                                                            borderRadius: '9999px',
                                                            background: 'linear-gradient(to right, #2563eb, #7c3aed)',
                                                            padding: '12px'
                                                        }}>
                                                            <Volume2 className="h-6 w-6 text-white" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-900"
                                                            style={{ color: '#111827' }}>
                                                            🎧 Listen Carefully
                                                        </h4>
                                                        <p className="text-sm flex items-center gap-2"
                                                            style={{ color: '#4b5563' }}>
                                                            <span style={{ display: 'flex', height: '8px', width: '8px' }}>
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    height: '8px',
                                                                    width: '8px',
                                                                    borderRadius: '9999px',
                                                                    backgroundColor: audioPlaying ? '#10b981' : '#9ca3af',
                                                                    animation: audioPlaying ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
                                                                }}></span>
                                                                <span style={{
                                                                    position: 'relative',
                                                                    height: '8px',
                                                                    width: '8px',
                                                                    borderRadius: '9999px',
                                                                    backgroundColor: audioPlaying ? '#10b981' : '#9ca3af'
                                                                }}></span>
                                                            </span>
                                                            {audioPlaying ? 'Playing...' : 'Ready to play'}
                                                        </p>
                                                    </div>
                                                </div>


                                                {/* Playback Speed Control - WORKING */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium" style={{ color: '#4b5563' }}>Speed:</span>
                                                    <div className="flex rounded-lg p-1" style={{ backgroundColor: '#f3f4f6' }}>
                                                        {[0.75, 1, 1.25, 1.5].map((speed) => (
                                                            <button
                                                                key={speed}
                                                                onClick={() => {
                                                                    const audio = document.getElementById('listening-audio');
                                                                    if (audio) {
                                                                        audio.playbackRate = speed;
                                                                        // Update active state
                                                                        document.querySelectorAll('[data-speed]').forEach(btn => {
                                                                            btn.style.backgroundColor = '#f3f4f6';
                                                                            btn.style.color = '#4b5563';
                                                                        });
                                                                        event.currentTarget.style.backgroundColor = '#ffffff';
                                                                        event.currentTarget.style.color = '#2563eb';
                                                                    }
                                                                }}
                                                                data-speed={speed}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    fontSize: '12px',
                                                                    borderRadius: '6px',
                                                                    transition: 'all 0.2s',
                                                                    backgroundColor: speed === 1 ? '#ffffff' : '#f3f4f6',
                                                                    color: speed === 1 ? '#2563eb' : '#4b5563',
                                                                    fontWeight: speed === 1 ? '500' : '400',
                                                                    boxShadow: speed === 1 ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    if (speed !== 1) {
                                                                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                                                                    }
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    if (speed !== 1) {
                                                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                                    }
                                                                }}
                                                            >
                                                                {speed}x
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* EQUALIZER VISUALIZER */}
                                            <div className="mb-4">
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-end',
                                                    justifyContent: 'center',
                                                    height: '64px',
                                                    gap: '2px',
                                                    marginBottom: '8px'
                                                }}>
                                                    {Array.from({ length: 40 }).map((_, i) => {
                                                        const height = audioPlaying
                                                            ? Math.floor(Math.random() * 16) + 4
                                                            : Math.floor(Math.random() * 4) + 2;

                                                        const colors = audioPlaying
                                                            ? i % 3 === 0 ? ['#3b82f6', '#60a5fa'] :
                                                                i % 3 === 1 ? ['#8b5cf6', '#a78bfa'] :
                                                                    ['#10b981', '#34d399']
                                                            : ['#d1d5db', '#e5e7eb'];

                                                        return (
                                                            <div
                                                                key={i}
                                                                style={{
                                                                    width: '3px',
                                                                    borderTopLeftRadius: '3px',
                                                                    borderTopRightRadius: '3px',
                                                                    background: `linear-gradient(to top, ${colors[0]}, ${colors[1]})`,
                                                                    height: `${height}px`,
                                                                    transition: 'all 0.3s',
                                                                    animation: audioPlaying
                                                                        ? `equalizerBar ${300 + (i % 5) * 100}ms ease-in-out infinite ${i * 20}ms`
                                                                        : 'none'
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>


                                                <div className="mt-4 space-y-2">
                                                    {/* Single Progress Bar Element with Fill */}
                                                    <div style={{ position: 'relative', width: '100%' }}>
                                                        <div
                                                            id="progress-track"
                                                            style={{
                                                                width: '100%',
                                                                height: '6px',
                                                                background: '#e5e7eb',
                                                                borderRadius: '9999px',
                                                                position: 'relative',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {/* Fill part - track ke andar hi */}
                                                            <div
                                                                id="progress-fill"
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '0',
                                                                    left: '0',
                                                                    height: '100%',
                                                                    width: '0%',
                                                                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                                                    borderRadius: '9999px',
                                                                    transition: 'width 0.1s linear'
                                                                }}
                                                            />

                                                            {/* Hidden range input jo actual seek karega */}
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                defaultValue="0"
                                                                id="audio-progress"
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '0',
                                                                    left: '0',
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    opacity: '0',
                                                                    cursor: 'pointer',
                                                                    zIndex: 2,
                                                                    margin: 0
                                                                }}
                                                                onChange={(e) => {
                                                                    const audio = document.getElementById('listening-audio');
                                                                    if (audio && audio.duration) {
                                                                        const percent = parseInt(e.target.value);
                                                                        audio.currentTime = (percent / 100) * audio.duration;

                                                                        // Update fill width
                                                                        const progressFill = document.getElementById('progress-fill');
                                                                        if (progressFill) {
                                                                            progressFill.style.width = `${percent}%`;
                                                                        }

                                                                        // Update time display
                                                                        updateCurrentTimeDisplay(audio);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Time Display */}
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginTop: '8px'
                                                    }}>
                                                        <span id="current-time" style={{
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            color: '#3b82f6'
                                                        }}>0:00</span>

                                                        <span id="duration" style={{
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            color: '#6b7280'
                                                        }}>0:00</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CUSTOM CONTROLS */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    {/* Custom Play/Pause Button */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: '43%',
                                                        top: '48%',
                                                        transform: 'translateY(-50%)'
                                                    }}>
                                                        <button
                                                            onClick={() => {
                                                                const audio = document.getElementById('listening-audio');
                                                                if (audio) {
                                                                    if (audioPlaying) {
                                                                        audio.pause();
                                                                    } else {
                                                                        audio.play();
                                                                    }
                                                                }
                                                            }}
                                                            style={{ position: 'relative' }}
                                                        >
                                                            <div style={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                                                                borderRadius: '9999px',
                                                                filter: 'blur(12px)',
                                                                opacity: 0,
                                                                transition: 'opacity 0.2s'
                                                            }}></div>
                                                            <div style={{
                                                                position: 'relative',
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '9999px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s',
                                                                ...(audioPlaying ? {
                                                                    background: 'linear-gradient(to right, #ef4444, #ec4899)'
                                                                } : {
                                                                    background: 'linear-gradient(to right, #10b981, #059669)'
                                                                })
                                                            }}
                                                                onMouseOver={(e) => {
                                                                    e.currentTarget.previousElementSibling.style.opacity = '0.3';
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    e.currentTarget.previousElementSibling.style.opacity = '0';
                                                                }}
                                                            >
                                                                {audioPlaying ? (
                                                                    <Pause className="h-5 w-5 text-white" />
                                                                ) : (
                                                                    <Play className="h-5 w-5 text-white" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    </div>


                                                </div>
                                            </div>

                                            {/* MAIN AUDIO PLAYER */}
                                            <div className="space-y-4">
                                                <div style={{ position: 'relative' }}>
                                                    <audio
                                                        id="listening-audio"
                                                        key={currentQuestion.content.audioUrl}
                                                        src={fixAudioUrl(currentQuestion.content.audioUrl)}
                                                        className="w-full h-12"
                                                        preload="metadata"
                                                        onPlay={() => setAudioPlaying(true)}
                                                        onPause={() => setAudioPlaying(false)}
                                                        onEnded={() => setAudioPlaying(false)}
                                                        // YEH LISTENERS ADD KARO:
                                                        onLoadedMetadata={(e) => {
                                                            const audio = e.target;
                                                            updateCurrentTimeDisplay(audio);
                                                            setAudioDuration(audio.duration);
                                                        }}
                                                        onTimeUpdate={(e) => {
                                                            const audio = e.target;
                                                            updateCurrentTimeDisplay(audio);
                                                            setCurrentTime(audio.currentTime);
                                                        }}
                                                    />


                                                </div>


                                                {/* TIME & VOLUME */}
                                                <div className="flex items-center justify-between text-xs" style={{ color: '#4b5563' }}>


                                                    <div className="flex items-center gap-2">
                                                        <Volume2 className="h-3 w-3" />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.1"
                                                            defaultValue="1"
                                                            onChange={(e) => {
                                                                const audio = document.querySelector('audio');
                                                                if (audio) audio.volume = parseFloat(e.target.value);
                                                            }}
                                                            style={{
                                                                width: '80px',
                                                                accentColor: '#3b82f6'
                                                            }}
                                                        />
                                                    </div>
                                                </div>


                                            </div>

                                            {/* INLINE STYLES FOR ANIMATIONS */}
                                            <style>
                                                {`
    /* Range slider thumb styling */
    #audio-progress::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        position: relative;
        z-index: 3;
    }
    
    #audio-progress::-moz-range-thumb {
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
    }
    
    /* Optional: Background gradient when dragging */
    #audio-progress:active::-webkit-slider-thumb {
        transform: scale(1.2);
        box-shadow: 0 2px 12px rgba(59, 130, 246, 0.7);
    }
`}
                                            </style>

                                            {/* TIME UPDATE SCRIPT */}
                                            <script dangerouslySetInnerHTML={{
                                                __html: `
                document.addEventListener('DOMContentLoaded', function() {
                    const audio = document.getElementById('listening-audio');
                    const currentTimeEl = document.getElementById('current-time');
                    const durationEl = document.getElementById('duration');
                    
                    if (audio && currentTimeEl && durationEl) {
                        // Set initial duration
                        audio.addEventListener('loadedmetadata', function() {
                            if (!isNaN(audio.duration)) {
                                const minutes = Math.floor(audio.duration / 60);
                                const seconds = Math.floor(audio.duration % 60);
                                durationEl.textContent = \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                            }
                        });
                        
                        // Update current time
                        audio.addEventListener('timeupdate', function() {
                            if (!isNaN(audio.currentTime)) {
                                const minutes = Math.floor(audio.currentTime / 60);
                                const seconds = Math.floor(audio.currentTime % 60);
                                currentTimeEl.textContent = \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                            }
                        });
                        
                        // Force load metadata
                        if (audio.readyState >= 1) {
                            const minutes = Math.floor(audio.duration / 60);
                            const seconds = Math.floor(audio.duration % 60);
                            durationEl.textContent = \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                        }
                    }
                });
            `
                                            }} />
                                        </div>
                                    )}

                                    {currentQuestion.content.passageTitle && (
                                        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <h4 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                                                {currentQuestion.content.passageTitle}
                                            </h4>

                                            {/* Passage Text with custom styling */}
                                            <div
                                                className="reading-passage text-gray-700 dark:text-gray-300 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: currentQuestion.content.passageText }}
                                            />

                                            {/* Custom styling for HTML elements inside passage */}
                                            <style jsx>{`
            .reading-passage h3 {
                font-size: 1.125rem;
                font-weight: 600;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                color: #1f2937;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 0.5rem;
            }
            
            .reading-passage p {
                margin-bottom: 1rem;
                line-height: 1.6;
            }
            
            .reading-passage strong {
                font-weight: 700;
                color: #374151;
            }
            
            .reading-passage ul {
                margin-left: 1.5rem;
                margin-bottom: 1rem;
                list-style-type: disc;
            }
            
            .reading-passage li {
                margin-bottom: 0.5rem;
            }
            
            .reading-passage hr {
                margin: 2rem 0;
                border: none;
                height: 1px;
                background-color: #e5e7eb;
            }
            
            /* Dark mode styles */
            .dark .reading-passage h3 {
                color: #f3f4f6;
                border-bottom-color: #4b5563;
            }
            
            .dark .reading-passage strong {
                color: #d1d5db;
            }
            
            .dark .reading-passage hr {
                background-color: #4b5563;
            }
        `}</style>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Panel - Question & Answers - 50% width */}
                            <div className="lg:col-span-1">
                                <div className="h-[525px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 
    /* Hide scrollbar but keep scroll functionality */
    overflow-y-scroll 
    [-ms-overflow-style:none]  /* IE and Edge */
    [scrollbar-width:none]  /* Firefox */
    /* For Chrome, Safari and Opera */
    [&::-webkit-scrollbar]:hidden">
                                    {/* Question Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {questionLabel}
                                                </div>
                                                {currentQuestion.title && (
                                                    <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                                        {currentQuestion.title}
                                                    </h2>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Section {progress.currentSection} • Q{progress.currentQuestion}
                                            </div>
                                        </div>

                                        {!showWritingLayout && (
                                            <div className="mt-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                                    {currentQuestion.content.instruction}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Question Form */}
                                    <form onSubmit={handleSubmit(sendAnswerAndGoNext)} className="space-y-6">
                                        {/* Speaking Controls */}
                                        {/* {showSpeakingLayout && (
                                            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-700/50">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Speaking Response</h4>
                                                    {recording && (
                                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                                            Recording...
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                    Record your answer. The audio will be saved as your response.
                                                </p>
                                            </div>

                                        )} */}

                                        {/* Question Content */}




                                        {currentQuestion.isQuestionGroup && currentQuestion.questionGroup?.length ? (
                                            <div className="space-y-6">
                                                {currentQuestion.questionGroup.map((group) => (
                                                    <div
                                                        key={group._id}
                                                        className="rounded-xl border-gray-200 bg-white p-6 dark:bg-gray-700"
                                                    >

                                                        {group.instruction && (
                                                            <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
                                                                {group.instruction}
                                                            </p>
                                                        )}
                                                        <div className="space-y-4">
                                                            {group.questions.map((sub, subIndex) => {
                                                                // Calculate question index in the flattened list
                                                                let questionIndex = 0;
                                                                let found = false;
                                                                for (const g of currentQuestion.questionGroup!) {
                                                                    for (const q of g.questions) {
                                                                        if (q._id === sub._id) {
                                                                            found = true;
                                                                            break;
                                                                        }
                                                                        questionIndex++;
                                                                    }
                                                                    if (found) break;
                                                                }

                                                                return (
                                                                    <div
                                                                        key={sub._id}
                                                                        className="rounded-xl bg-gray-50 p-4 dark:bg-gray-600/30"
                                                                    >
                                                                        {/* Show question number for all types except summary/note completion */}
                                                                        {group.type !== "summary_completion" && group.type !== "note_completion" && (
                                                                            <div className="flex items-center gap-2 mb-3">

                                                                                <span className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-semibold">
                                                                                    {getQuestionNumberDisplay(questionIndex)}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {group.type !== "summary_completion" && group.type !== "note_completion" && group.type !== "matching" && (
                                                                            <p className="mb-3 text-[18px] text-gray-900 dark:text-white">
                                                                                <div dangerouslySetInnerHTML={{ __html: sub.question }} />
                                                                            </p>
                                                                        )}

                                                                        {renderAnswerField(
                                                                            sub._id,
                                                                            group.type,
                                                                            sub.options,
                                                                            sub.question,
                                                                            group.commonOptions,
                                                                            questionIndex // Pass question index
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Show question number for single questions */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-semibold">
                                                        {numbering?.firstSectionQuestionNumber || 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Question {numbering?.firstSectionQuestionNumber || 1}
                                                    </span>
                                                </div>


                                                {renderAnswerField(
                                                    currentQuestion._id,
                                                    currentQuestion.questionType,
                                                    currentQuestion.options,
                                                    currentQuestion.content.passageText || currentQuestion.content.instruction,
                                                    undefined,
                                                    0 // Pass question index 0 for single question
                                                )}
                                            </div>
                                        )}

                                        {/* COMPLETE NAVIGATION WITH MATCHING NUMBERING */}
                                        <div className="bg-[#bcdaff] fixed bottom-0 left-0 right-0 border-t border-[#c10007] p-2 md:p-3 shadow-lg z-50">
                                            <div className="max-w-7xl mx-auto">
                                                <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">

                                                    {/* Progress Counter - Shows actual question numbering */}
                                                    <div className="text-sm text-gray-700 font-medium">
                                                        <span className="md:hidden">
                                                            {(() => {
                                                                if (!progress || !numbering) return `Q${progress?.currentQuestion + 1 || 1}`;

                                                                const currentQuestionIdx = progress.currentQuestion;
                                                                const startNumber = calculateQuestionStartingNumber(currentQuestionIdx);
                                                                const allQuestions = getAllQuestions();
                                                                const question = allQuestions[currentQuestionIdx];
                                                                const count = getQuestionNumberCount(question, currentQuestionIdx);

                                                                if (count > 1) {
                                                                    return `Q${startNumber}-${startNumber + count - 1}`;
                                                                }
                                                                return `Q${startNumber}`;
                                                            })()}
                                                        </span>
                                                        <span className="hidden md:inline">
                                                            {(() => {
                                                                if (!progress || !numbering) return `Question ${progress?.currentQuestion + 1 || 1}`;

                                                                const currentQuestionIdx = progress.currentQuestion;
                                                                const startNumber = calculateQuestionStartingNumber(currentQuestionIdx);
                                                                const allQuestions = getAllQuestions();
                                                                const question = allQuestions[currentQuestionIdx];
                                                                const count = getQuestionNumberCount(question, currentQuestionIdx);

                                                                if (count > 1) {
                                                                    return `Questions ${startNumber}-${startNumber + count - 1}`;
                                                                }
                                                                return `Question-`;
                                                            })()}
                                                            {numbering?.totalGlobalQuestions || progress?.totalQuestions || 1}
                                                        </span>
                                                    </div>

                                                    {/* Pagination - Matches question numbering */}
                                                    <div className="w-full md:w-auto py-1 md:py-0">
                                                        <div className="flex items-center gap-1 md:gap-2 min-w-min px-4">
                                                            {(() => {
                                                                if (!progress || !currentQuestion) return null;

                                                                const allQuestions = getAllQuestions();
                                                                let currentQuestionNumber = numbering?.firstSectionQuestionNumber || 1;
                                                                let questionElements = [];

                                                                for (let i = 0; i < allQuestions.length; i++) {
                                                                    const question = allQuestions[i];
                                                                    const questionNumberCount = getQuestionNumberCount(question, i);
                                                                    const isCurrentQuestion = i === progress.currentQuestion;
                                                                    const isAnswered = i < progress.currentQuestion;

                                                                    if (questionNumberCount > 1) {
                                                                        // Multiple numbers (summary completion, etc.)
                                                                        questionElements.push(
                                                                            <button
                                                                                key={i}
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    goToQuestion(i);
                                                                                }}
                                                                                className={`px-2 bg-[#fef2f2] py-1.5 md:px-3 md:py-2 flex items-center justify-center rounded-lg text-xs md:text-sm border-[#c10007] font-semibold transition-all min-w-[50px] md:min-w-[60px] border
                      ${isCurrentQuestion
                                                                                        ? ' text-black border-[#c10007] scale-105 shadow'
                                                                                        : isAnswered
                                                                                    }`}
                                                                                disabled={i > progress.currentQuestion}
                                                                            >
                                                                                {currentQuestionNumber}-{currentQuestionNumber + questionNumberCount - 1}
                                                                            </button>
                                                                        );
                                                                    } else {
                                                                        // Single number
                                                                        questionElements.push(
                                                                            <button
                                                                                key={i}
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    goToQuestion(i);
                                                                                }}
                                                                                className={`w-8 h-8 md:w-9 md:h-9 bg-[#fef2f2] border-[#c10007] flex items-center justify-center rounded-full text-sm md:text-base font-semibold transition-all border
                      ${isCurrentQuestion
                                                                                        ? 'text-black  border-[#c10007] scale-110 shadow'
                                                                                        : isAnswered

                                                                                    }`}
                                                                                disabled={i > progress.currentQuestion}
                                                                            >
                                                                                {currentQuestionNumber}
                                                                            </button>
                                                                        );
                                                                    }

                                                                    currentQuestionNumber += questionNumberCount;
                                                                }

                                                                return questionElements;
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Navigation Buttons */}
                                                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 md:flex-none border-gray-300 text-gray-700 hover:bg-gray-50"
                                                            disabled={!canGoPrevious || isSubmitting}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (canGoPrevious) goToPreviousQuestion();
                                                            }}
                                                        >
                                                            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                                            <span className="text-xs md:text-sm">Previous</span>
                                                        </Button>

                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            className="flex-1 md:flex-none bg-[#c10007] hover:bg-[#a00006] text-white"
                                                            disabled={isSubmitting}
                                                        >
                                                            <span className="text-xs md:text-sm">
                                                                {isSubmitting ? 'Submitting...' :
                                                                    progress && progress.currentQuestion === progress.totalQuestions - 1 ? 'Finish' : 'Next'
                                                                }
                                                            </span>
                                                            <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
                                                        </Button>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </form>

                                    {globalError && (
                                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                            <p className="text-sm">{globalError}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

            </div>
        );
    };

    const renderResultView = () => {
        if (!analysis || !testSeries) return null;
        const s = analysis.summary;

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            Test Completed Successfully
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Test Results</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{testSeries.title}</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Questions</div>
                            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{s.totalQuestions}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">Correct</div>
                            <div className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{s.correctAnswers}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-red-600 dark:text-red-400">Incorrect</div>
                            <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{s.incorrectAnswers}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Accuracy</div>
                            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {s.accuracy.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Section-wise Performance */}
                    <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-800">
                        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Section-wise Performance</h3>
                        </div>
                        <div className="overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Section</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Questions</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Correct</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Accuracy</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {analysis.sectionWiseAnalysis.map((sec, index) => (
                                        <tr key={sec.sectionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {sec.sectionType}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                {sec.totalQuestions}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-green-600 dark:text-green-400">
                                                {sec.correctAnswers}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-blue-600 dark:text-blue-400">
                                                {sec.accuracy.toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                {sec.score}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-center gap-4">
                        <Button
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => window.history.back()}
                        >
                            <Home className="h-4 w-4" />
                            Back to Home
                        </Button>
                        <Button
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => {
                                setAnalysis(null);
                                fetchOrStartTest();
                            }}
                        >
                            Retake Test
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // ---------- Main render ----------
    if (loading && !testSeries) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-400">Loading test...</p>
                </div>
            </div>
        );
    }

    if (globalError && !testSeries) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Error Loading Test</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{globalError}</p>
                    <Button className="mt-6" onClick={fetchOrStartTest}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // Component ke END mein, return se pehle:

    console.log("🔄 Current view mode:", viewMode);

    /// Main render logic
    // if (showVoiceVerification) {
    //     return (
    //         <VoiceVerification
    //             onComplete={startSpeakingSection}
    //             onBack={() => {
    //                 setShowVoiceVerification(false);
    //                 setViewMode("sections");
    //             }}
    //             sessionId={sessionId}
    //             sectionName="Speaking Test"
    //         />
    //     );
    // }

    if (viewMode === "sections") return renderSectionsView();
    if (viewMode === "question") return renderQuestionView();
    if (viewMode === "result") return renderResultView();

    return null;
};

export default FullLengthTestPage;