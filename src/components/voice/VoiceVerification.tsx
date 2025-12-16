import React, { useState, useEffect, useRef } from "react";
import {
    Mic,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Settings,
    Monitor,
    Chrome,
    AlertCircle,
    Play,
    StopCircle,
    Volume2
} from "lucide-react";

interface VoiceVerificationProps {
    onComplete: () => void;
    onBack: () => void;
    sessionId: string | null;
    sectionName?: string;
}

const TEST_SENTENCE = "I Appreciate Everyone Taking The Time To Join This Meeting";

const VoiceVerification: React.FC<VoiceVerificationProps> = ({
    onComplete,
    onBack,
    sessionId,
    sectionName = "Speaking Section"
}) => {
    // State
    const [currentStep, setCurrentStep] = useState<"system_check" | "voice_test">("system_check");
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("");
    const [spokenText, setSpokenText] = useState("");
    const [accuracy, setAccuracy] = useState(0);
    const [hasResult, setHasResult] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSupported, setIsSupported] = useState(true);
    const [recordedAudio, setRecordedAudio] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Refs
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<string>("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioElementRef = useRef<HTMLAudioElement>(null);

    // Initialize system requirements
    useEffect(() => {
        checkSystemRequirements();
    }, []);

    // Initialize speech recognition
    useEffect(() => {
        if (currentStep === "voice_test") {
            initSpeechRecognition();
        }
    }, [currentStep]);

    const checkSystemRequirements = () => {
        // Check system requirements
    };

    const initSpeechRecognition = () => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognitionAPI) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = true;
        
        recognition.onresult = (event: any) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcriptRef.current += " " + event.results[i][0].transcript;
            }
        };

        recognition.onend = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            
            setIsRecording(false);
            setStatus("Recording finished");
            
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            
            const spoken = transcriptRef.current.trim();
            setSpokenText(spoken || "Nothing detected");
            
            if (!spoken) {
                setAccuracy(0);
                setHasResult(true);
                return;
            }

            const calculatedAccuracy = calculateAccuracy(TEST_SENTENCE.toLowerCase(), spoken.toLowerCase());
            setAccuracy(calculatedAccuracy);
            setHasResult(true);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setStatus(`Error: ${event.error}`);
            setIsRecording(false);
            
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };

        recognitionRef.current = recognition;
    };

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 5) {
                        if (recognitionRef.current) {
                            recognitionRef.current.stop();
                        }
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

   const startRecording = async () => {
    if (!recognitionRef.current) {
        setStatus("Speech recognition not initialized");
        return;
    }

    // Reset states
    setStatus("");
    setSpokenText("");
    setAccuracy(0);
    setHasResult(false);
    setRecordingTime(0);
    setRecordedAudio("");
    transcriptRef.current = "";
    audioChunksRef.current = [];
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        mediaStreamRef.current = stream;
        
        startAudioRecording(stream);
        
        setIsRecording(true);
        setStatus("Recording... Please speak the sentence");
        
        // Start recognition
        try {
            recognitionRef.current.start();
        } catch (recognitionError) {
            console.error("Speech recognition start error:", recognitionError);
            setStatus("Speech recognition failed to start");
            setIsRecording(false);
            return;
        }
        
        // Auto-stop after 5 seconds
        timerRef.current = setTimeout(() => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        }, 5000);
        
    } catch (err) {
        console.error("Microphone access error:", err);
        setStatus("Microphone access denied or not available");
        setIsRecording(false);
    }
};

const startAudioRecording = (stream: MediaStream) => {
    try {
        // Try different MIME types
        const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            ''
        ];
        
        let options = {};
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                if (mimeType) {
                    options = { mimeType };
                }
                break;
            }
        }
        
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                audioChunksRef.current.push(e.data);
                console.log("Audio chunk received:", e.data.size, "bytes");
            }
        };
        
        mediaRecorder.onstop = () => {
            console.log("MediaRecorder stopped, chunks:", audioChunksRef.current.length);
            
            if (audioChunksRef.current.length === 0) {
                console.error("No audio chunks recorded");
                setStatus("Recording failed: No audio data");
                return;
            }
            
            try {
                const audioBlob = new Blob(audioChunksRef.current, { 
                    type: mediaRecorder.mimeType || 'audio/webm' 
                });
                console.log("Audio blob created:", audioBlob.size, "bytes", audioBlob.type);
                
                const audioUrl = URL.createObjectURL(audioBlob);
                console.log("Audio URL created:", audioUrl);
                
                setRecordedAudio(audioUrl);
                
                // Test if audio can be played
                const testAudio = new Audio();
                testAudio.src = audioUrl;
                testAudio.oncanplaythrough = () => {
                    console.log("Audio is playable");
                };
                testAudio.onerror = (e) => {
                    console.error("Audio test error:", e);
                };
                
            } catch (blobError) {
                console.error("Blob creation error:", blobError);
                setStatus("Recording failed: Could not create audio file");
            }
        };
        
        mediaRecorder.onerror = (e) => {
            console.error("MediaRecorder error:", e);
            setStatus("Recording error occurred");
        };
        
        console.log("Starting MediaRecorder with:", options);
        mediaRecorder.start(100); // Collect data every 100ms
        console.log("MediaRecorder started, state:", mediaRecorder.state);
        
    } catch (err) {
        console.error("Audio recording initialization failed:", err);
        setStatus("Audio recording not supported in this browser");
    }
};

const playRecording = () => {
    console.log("playRecording called");
    console.log("recordedAudio:", recordedAudio);
    console.log("audioElementRef.current:", audioElementRef.current);
    
    if (!recordedAudio) {
        console.error("No recorded audio available");
        setStatus("No recording available");
        return;
    }
    
    // Agar ref available nahi hai, toh naya audio element create karo
    if (!audioElementRef.current) {
        console.log("Creating new audio element");
        const newAudio = new Audio(recordedAudio);
        audioElementRef.current = newAudio;
    } else {
        // Existing audio element update karo
        audioElementRef.current.src = recordedAudio;
    }
    
    const audioElement = audioElementRef.current;
    
    // Event listeners add karo
    audioElement.onended = () => {
        console.log("Playback ended");
        setIsPlaying(false);
    };
    
    audioElement.onerror = (e) => {
        console.error("Audio playback error:", e);
        setStatus("Error playing audio");
        setIsPlaying(false);
    };
    
    if (isPlaying) {
        console.log("Pausing audio");
        audioElement.pause();
        setIsPlaying(false);
    } else {
        console.log("Starting playback");
        audioElement.play()
            .then(() => {
                console.log("Playback started successfully");
                setIsPlaying(true);
                setStatus("Playing recording...");
            })
            .catch(err => {
                console.error("Play failed:", err);
                
                // Try with new audio element
                const tempAudio = new Audio(recordedAudio);
                tempAudio.play()
                    .then(() => {
                        console.log("Playback with new audio successful");
                        setIsPlaying(true);
                        audioElementRef.current = tempAudio;
                    })
                    .catch(secondErr => {
                        console.error("Second attempt failed:", secondErr);
                        setStatus(`Cannot play: ${err.message}`);
                    });
            });
    }
};

    const calculateAccuracy = (expected: string, spoken: string): number => {
        const expectedWords = expected.split(" ");
        const spokenWords = spoken.split(" ");
        
        let matched = 0;
        expectedWords.forEach(word => {
            if (spokenWords.includes(word)) matched++;
        });
        
        return (matched / expectedWords.length) * 100;
    };

    const passed = accuracy >= 50;
    const canContinue = hasResult && passed;

    // System Requirements Screen (Screenshot 67)
    const renderSystemCheck = () => {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">

               
<audio 
    ref={audioElementRef}
    style={{ display: 'none' }}
    controls
    preload="metadata"
    onError={(e) => console.error("Audio element error:", e)}
/>
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Back</span>
                        </button>
                        
                     
                    </div>

                    {/* System Requirements Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                            System Requirement for Test
                        </h2>
                        
                        <div className="space-y-6">
                            {/* JavaScript */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                        <div className="text-yellow-600 dark:text-yellow-400 font-bold">JS</div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">JavaScript</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Enabled</span>
                                </div>
                            </div>
                            
                            {/* Resolution */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Resolution (Laptop & Desktop)</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">1280 X 720</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Supported</span>
                                </div>
                            </div>
                            
                            {/* Browser */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                        <Chrome className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Recommended Browser</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Google Chrome</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Detected</span>
                                </div>
                            </div>
                            
                            {/* Microphone */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                        <Mic className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Microphone</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Will be tested next</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Test Required</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Next Button */}
                    <div className="text-center">
                        <button
                            onClick={() => setCurrentStep("voice_test")}
                            className="px-12 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center gap-3 mx-auto"
                        >
                            Next
                            <ArrowRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Microphone Check Screen (Screenshot 66)
    const renderVoiceTest = () => {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => setCurrentStep("system_check")}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Back</span>
                        </button>
                        
                     
                    </div>

                    {/* Microphone Check Card */}
                    <div className="bg-white gap-[20px] dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 flex justify-evenly">
                       <div className="title w-[50%]"> <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                            Microphone Check
                        </h2>
                         {/* Instructions */}
                        <div className="mb-8">
                            <p className="text-gray-700 text-sm dark:text-gray-300 mb-4">
                                To Improve The Audio Recording Quality in The Classroom (Or Anywhere Your Student Use The Headphone), We Suggest That You Follow These Recommendations:
                            </p>
                            
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 pl-4 py-3 mb-4">
                                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                                    Microphone positioning:
                                </p>
                                <p className="text-gray-700 text-sm dark:text-gray-300">
                                    Place headset microphone two fingers width from mouth corner and below lip for optimal sound quality and to record the voice.
                                </p>
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 pl-4 py-3">
                                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                                    Note:
                                </p>
                                <p className="text-gray-700 text-sm dark:text-gray-300">
                                    Once positioned correctly, you should not touch the headset or move the microphone. Speak loudly and clearly to capture the voice on microphone.
                                </p>
                            </div>
                        </div>
                        
                        </div>
                        
                       
                        
                        {/* Divider */}
                        <div className="border-t border-gray-300 dark:border-gray-700 my-8"></div>
                        
                        {/* Test Sentence */}
                        <div className="text-center mb-8">
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                To check your microphone please repeat below sentence
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                                <p className="text-base text-gray-900 dark:text-white font-medium italic">
                                    "{TEST_SENTENCE}"
                                </p>
                            </div>
                              {/* Divider */}
                        <div className="border-t border-gray-300 dark:border-gray-700 my-8"></div>
                        
                        {/* Recording Controls */}
                        <div className="space-y-6">
                            {/* Status */}
                            {status && (
                                <div className={`p-4 rounded-xl text-center ${
                                    status.includes('Recording finished') 
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                                        : status.includes('Error') 
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                }`}>
                                    <div className="flex items-center justify-center gap-2">
                                        {isRecording && (
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        )}
                                        <span>{status}</span>
                                        {isRecording && (
                                            <span className="font-bold ml-2">({recordingTime}/5s)</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Check Microphone Button */}
                            <button
                                onClick={startRecording}
                                disabled={isRecording}
                                className={`w-full py-2 rounded-xl font-bold text-base flex items-center justify-center gap-3 ${
                                    isRecording 
                                        ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                                }`}
                            >
                                <Mic className="h-6 w-6" />
                                {isRecording ? 'Recording...' : 'Check Microphone'}
                            </button>
                            
                            {/* Results Section */}
                            {hasResult && (
                                <div className={`p-2 rounded-xl ${
                                    passed 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-2 text-base border-green-200 dark:border-green-800' 
                                        : 'bg-red-50 dark:bg-red-900/20 text-base border-2 border-red-200 dark:border-red-800'
                                }`}>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            {passed ? (
                                                <CheckCircle className="h-8 w-8 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-8 w-8 text-red-500" />
                                            )}
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {passed ? 'Microphone Working!' : 'Microphone Check Failed'}
                                            </h3>
                                        </div>
                                        
                                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                                            Accuracy: <span className="font-bold">{accuracy.toFixed(1)}%</span>
                                        </p>
                                        
                                        {spokenText && (
                                            <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg mb-4">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You said:</p>
                                                <p className="text-gray-800 dark:text-gray-200">{spokenText}</p>
                                            </div>
                                        )}
                                        
                                        {recordedAudio && (
                                            <button
                                                onClick={playRecording}
                                                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                            >
                                                {isPlaying ? (
                                                    <>
                                                        <StopCircle className="h-5 w-5" />
                                                        Stop Playback
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-5 w-5" />
                                                        Play Recording
                                                    </>
                                                )}
                                            </button>
                                            
                                        )}
                                        {/* Next Button */}
                    <div className="text-center">
                        {canContinue ? (
                            <button
                                onClick={onComplete}
                                className="px-3 py-3 mt-[10px] bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-base rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center gap-3 mx-auto"
                            >
                                Next
                                <ArrowRight className="h-6 w-6" />
                            </button>
                        ) : hasResult && !passed ? (
                            <button
                                onClick={startRecording}
                                className="px-3 py-3 mt-[10px] text-base bg-gradient-to-r from-red-500 to-red-600 text-white font-bold  rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex text-base items-center gap-3 mx-auto"
                            >
                                Try Again
                                <ArrowRight className="h-6 w-6" />
                            </button>
                        ) : null}
                    </div>
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

    return currentStep === "system_check" ? renderSystemCheck() : renderVoiceTest();
};

export default VoiceVerification;