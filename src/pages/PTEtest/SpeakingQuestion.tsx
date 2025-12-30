import React, { useState, useEffect, useRef, useCallback, memo } from "react"
import { Volume2, Mic, Clock, Volume2Icon, Play, Pause, StopCircle , Square } from "lucide-react"
import { audioBaseUrl } from "../../axiosInstance"

const SpeakingQuestion = ({ qDoc ,handleRecordingComplete}) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [countdown, setCountdown] = useState(-1)
    const [currentStatus, setCurrentStatus] = useState("Preparing...")
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
    const [audioSize, setAudioSize] = useState(0)
    const [ttsProgress, setTtsProgress] = useState(0)
    const [estimatedTtsDuration, setEstimatedTtsDuration] = useState(0)
    const [hasPlayed, setHasPlayed] = useState(false)
    const [hasRecorded, setHasRecorded] = useState(false)
    const [audioVolume, setAudioVolume] = useState(1)
    const [audioCurrentTime, setAudioCurrentTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)

    // ✅ FIRST: Check for audio URL from API
    const audioUrl = qDoc.typeSpecific?.audio
                        ? audioBaseUrl + qDoc.typeSpecific.audio
                        : undefined
    
    // ✅ SECOND: Fallback to TTS text
    const questionText = qDoc?.typeSpecific?.listeningText || qDoc?.questionText || "No question available"
    
    // ✅ Priority logic
    const hasAudioUrl = !!audioUrl
    const hasQuestionText = !!questionText && questionText !== "No question available"
    const useAudio = hasAudioUrl
    const useTTS = !hasAudioUrl && hasQuestionText

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const audioContextRef = useRef(null)
    const recordingTimerRef = useRef(null)
    const countdownTimerRef = useRef(null)
    const ttsTimerRef = useRef(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)


     // State for audio level
    const [audioLevel, setAudioLevel] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);

    const drawVisualizer = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set canvas size
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArray);
            
            // Clear canvas with light gray background like image
            ctx.fillStyle = '#e4e7ec'; // Light gray background
            ctx.fillRect(0, 0, width, height);
            
            // Calculate average audio level for state
            let sum = 0;
            let count = 0;
            for (let i = 0; i < Math.min(bufferLength, 64); i++) { // Use only low frequencies for voice
                sum += dataArray[i];
                count++;
            }
            const avg = count > 0 ? sum / count : 0;
            setAudioLevel(Math.min(100, (avg / 255) * 100));
            
            // Draw bars - thinner and more numerous like image
            const barCount = 60; // More bars for detailed look
            const barWidth = width / barCount;
            const spacing = 0.5;
            
            for (let i = 0; i < barCount; i++) {
                // Map bar index to frequency data
                const freqIndex = Math.floor((i / barCount) * bufferLength * 0.4); // Focus on lower frequencies
                const barHeight = (dataArray[freqIndex] / 255) * height;
                
                // Calculate position
                const x = i * barWidth;
                const y = height - barHeight;
                
                // Use the exact blue color from image: #4669e3
                const gradient = ctx.createLinearGradient(0, y, 0, height);
                gradient.addColorStop(0, '#ef4444'); // Top color
                gradient.addColorStop(0.5, '#f97316'); // Middle color
                gradient.addColorStop(1, '#eab308'); // Bottom color - same solid color
                
                ctx.fillStyle = gradient;
                
                // Draw rounded bar
                const barRadius = 1;
                const actualWidth = barWidth - spacing;
                
                // Rounded rectangle
                ctx.beginPath();
                ctx.moveTo(x + barRadius, y);
                ctx.lineTo(x + actualWidth - barRadius, y);
                ctx.quadraticCurveTo(x + actualWidth, y, x + actualWidth, y + barRadius);
                ctx.lineTo(x + actualWidth, height);
                ctx.lineTo(x, height);
                ctx.lineTo(x, y + barRadius);
                ctx.quadraticCurveTo(x, y, x + barRadius, y);
                ctx.closePath();
                ctx.fill();
            }
            
            // Add bottom border like in image
            ctx.fillStyle = '#e4e7ec';
            ctx.fillRect(0, height - 1, width, 1);
        };
        
        draw();
    }, []);

    const startVisualization = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            if (!canvasRef.current) return;
            
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const microphone = audioCtx.createMediaStreamSource(stream);
            
            analyser.fftSize = 512; // Higher for more detail
            analyser.minDecibels = -60;
            analyser.maxDecibels = -10;
            analyser.smoothingTimeConstant = 0.7;
            
            microphone.connect(analyser);
            
            analyserRef.current = analyser;
            audioContext.current = audioCtx;
            mediaStreamRef.current = stream;
            
            drawVisualizer();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }, [drawVisualizer]);

    const stopVisualization = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        
        if (analyserRef.current && audioContext.current) {
            analyserRef.current.disconnect();
        }
        
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        setAudioLevel(0);
    }, []);

    // Start/stop visualization based on recording state
    useEffect(() => {
        if (isRecording) {
            startVisualization();
        } else {
            stopVisualization();
        }
        
        return () => {
            stopVisualization();
        };
    }, [isRecording, startVisualization, stopVisualization]);






    // Initialize and auto-play (audio first, TTS fallback)
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()

        // Auto-play after 3 seconds (ONLY ONCE)
        setTimeout(() => {
            if ((useAudio || useTTS) && !hasPlayed) {
                if (useAudio) {
                    playAudio()
                } else if (useTTS) {
                    playTTS()
                }
            }
        }, 3000)

        // Cleanup
        return () => {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
            if (ttsTimerRef.current) clearInterval(ttsTimerRef.current)
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop()
            }
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
            window.speechSynthesis.cancel()
            if (audioContextRef.current) audioContextRef.current.close()
            if (chunksRef.current) chunksRef.current = []
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
        }
    }, [])

    // ✅ Audio playback function
    const playAudio = () => {
        if (!audioUrl || !audioRef.current) {
            // Fallback to TTS if audio fails
            if (useTTS) {
                playTTS()
            }
            return
        }

        setHasPlayed(true)
        setIsPlaying(true)
        setCurrentStatus("Playing audio...")

        audioRef.current.volume = audioVolume
        audioRef.current.play().catch(error => {
            console.error("Audio playback failed:", error)
            setCurrentStatus("Audio playback failed")
            setIsPlaying(false)
            
            // Fallback to TTS
            if (useTTS) {
                playTTS()
            }
        })

        // Auto start countdown after audio ends
        audioRef.current.onended = () => {
            setIsPlaying(false)
            startCountdown()
        }
    }

 

    // ✅ TTS playback function (fallback)
    const playTTS = () => {
        if (hasPlayed) return

        if (!useTTS) {
            setCurrentStatus("No audio or text available")
            return
        }

        setHasPlayed(true)
        const estimatedDuration = Math.max(2, questionText.length / 150)
        setEstimatedTtsDuration(estimatedDuration)
        setTtsProgress(0)
        setIsPlaying(true)
        setCurrentStatus("Playing TTS...")

        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(questionText)

        const voices = window.speechSynthesis.getVoices()
        const femaleVoice = voices.find((v) => /female|samantha|zira|jane|serena|karen|ava|tessa/i.test(v.name))
        if (femaleVoice) utterance.voice = femaleVoice

        utterance.rate = 0.7
        utterance.pitch = 0.7
        utterance.volume = audioVolume

        // Progress simulation
        ttsTimerRef.current = setInterval(() => {
            setTtsProgress((prev) => {
                const newProgress = prev + 0.1
                if (newProgress >= estimatedDuration) {
                    clearInterval(ttsTimerRef.current)
                    return estimatedDuration
                }
                return newProgress
            })
        }, 100)

        utterance.onend = () => {
            setIsPlaying(false)
            clearInterval(ttsTimerRef.current)
            setTtsProgress(estimatedDuration)
            startCountdown()
        }

        utterance.onerror = () => {
            setIsPlaying(false)
            clearInterval(ttsTimerRef.current)
            startCountdown()
        }

        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
    }



    // ✅ Volume control
    const handleVolumeChange = (value: number) => {
        setAudioVolume(value)
        if (audioRef.current) {
            audioRef.current.volume = value
        }
        if (utteranceRef.current) {
            utteranceRef.current.volume = value
        }
    }

    // Start 10-second countdown
    const startCountdown = () => {
        if (hasRecorded) return

        setCurrentStatus("Preparing to record...")
        let count = 10
        setCountdown(count)

        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)

        countdownTimerRef.current = setInterval(() => {
            count--
            setCountdown(count)

            if (count <= 3 && count > 0) {
                playBeep(600, 0.2)
                setCurrentStatus(`Starting in ${count}...`)
            }

            if (count <= 0) {
                clearInterval(countdownTimerRef.current)
                setCountdown(-1)
                playBeep(800, 0.5)
                setTimeout(startRecording, 500)
            }
        }, 1000)
    }

    // Play beep sound
    const playBeep = (freq, duration) => {
        try {
            const ctx = audioContextRef.current
            if (ctx.state === "suspended") ctx.resume()

            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.value = 0.3

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + duration)
        } catch (e) {
            console.log("[v0] Beep failed:", e)
        }
    }

    const startRecording = async () => {
        if (hasRecorded) return

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 24000,
                },
            })

            const mimeType = "audio/webm;codecs=opus"
            const options = {
                mimeType,
                audioBitsPerSecond: 32000,
            }

            mediaRecorderRef.current = new MediaRecorder(stream, options)
            chunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType })
                setAudioSize((blob.size / 1024).toFixed(2))
                setAudioPreviewUrl(URL.createObjectURL(blob))
                setCurrentStatus("Recording complete - No replay or re-record allowed")
                setHasRecorded(true)
                stream.getTracks().forEach((track) => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setRecordingTime(0)
            setCurrentStatus("Recording... Speak now!")

            // 40-second timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= 39) {
                        clearInterval(recordingTimerRef.current)
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                            mediaRecorderRef.current.stop()
                        }
                        setIsRecording(false)
                        return 40
                    }
                    return prev + 1
                })
            }, 1000)
        } catch (error) {
            console.error("[v0] Recording failed:", error)
            setCurrentStatus("Recording failed - Microphone access denied")
        }
    }

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    // Download audio
    const downloadAudio = () => {
        if (!audioPreviewUrl) return
        const a = document.createElement("a")
        a.href = audioPreviewUrl
        a.download = `speaking-response-${Date.now()}.webm`
        a.click()
    }

    return (
        <div className="bg-white flex justify-between dark:bg-slate-900 pt-4 rounded-lg min-h-[65vh] overflow-y-auto">

            <div className="flex-block">

                 {/* Stimulus */}
            {qDoc?.stimulus && (
                <div
                    className="prose text-base prose-sm dark:prose-invert max-w-none mb-6"
                    dangerouslySetInnerHTML={{ __html: qDoc.stimulus }}
                />
            )}

            {/* Question */}
            {qDoc?.questionType != "retell_lesson" && <div className="mb-6">
                <h2 className="" dangerouslySetInnerHTML={{ __html: qDoc?.questionText }} />
            </div>}

            </div>
           

            <div className="w-[70%] mx-7">
                {/* ✅ UPDATED: Audio/TTS Player */}
                <div className="bg-gray-200 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            
                            <span className="font-semibold text-black dark:text-blue-100">
                                {useAudio ? "AUDIO PLAYER" : "TEXT TO SPEECH"}
                            </span>
                        </div>
                        
                        {/* Volume Control */}
                        <div className="flex items-center gap-2">

                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={audioVolume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                className="w-20 h-2  rounded-lg  cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">Progress</span>
                           
                        </div>
                        
                        <div className="w-full bg-white rounded-full h-4">
                            <div
                                className="bg-slate-500 h-4 rounded-full transition-all duration-100"
                                style={{ 
                                    width: useAudio 
                                        ? `${audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0}%`
                                        : `${Math.min(100, (ttsProgress / estimatedTtsDuration) * 100)}%`
                                }}
                            />
                        </div>
                    </div>

                  

                    {/* Status */}
                    <div className="mt-3 text-sm flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span
                            className={`px-2 py-1 rounded ${isPlaying
                                ? "bg-blue-200 dark:bg-blue-800"
                                : hasPlayed
                                    ? "bg-green-200 dark:bg-green-800"
                                    : "bg-gray-200 dark:bg-gray-700"
                                }`}
                        >
                            {currentStatus}
                        </span>
                    </div>

                    {/* Info */}
                    {hasPlayed && !isPlaying && (
                        <p className="mt-2 text-xs text-blue-700 dark:text-blue-300 font-medium">
                            ⚠️ {useAudio ? "Audio" : "Question"} has been played.
                        </p>
                    )}
                </div>

                {/* Rest of your existing code remains the same */}
                {/* Countdown Display */}
                {countdown >= 0 && (
                <div className="flex items-center justify-center gap-4 p-6 rounded-lg text-center">
                    <div className="relative">
                        <div className="relative w-16 h-16 rounded-full border-4 border-slate-500 dark:border-slate-700 bg-white flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-400 dark:text-orange-400">
                                {countdown}
                            </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-400 mb-1">
                            Recording in {countdown} seconds
                        </h3>
                    </div>
                </div>
            )}

                 {isRecording && (
                <div className="bg-gray-200 p-4 mt-3 rounded-xl shadow-lg w-[70%] mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <Mic className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-semibold text-black tracking-wide">
                                RECORDING LIVE
                            </span>
                        </div>
                        <span className="text-xs text-black">Speak clearly</span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                        <div className="w-full bg-white rounded-full h-4 overflow-hidden">
                            <div
                                className="h-full bg-gray-500 transition-all"
                                style={{
                                    width: `${(recordingTime / 40) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Audio Visualizer */}
                    <div className="mb-4">
                        
                        
                        {/* Canvas container with border like image */}
                    
                            <canvas 
                                ref={canvasRef}
                                className="w-full h-16"
                            />
                        
                        
                       
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-black">
                            Your voice is being recorded
                        </span>
                        <span className="text-xs text-gray-600">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                </div>
            )}

                {/* Recording Preview */}
                {audioPreviewUrl && hasRecorded && (
                    <div className="p-4 mt-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">
                            ✓ Your voice has been recorded
                        </h3>

                      

                       
                    </div>
                )}
            </div>

            {/* ✅ Hidden audio element for API audio */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="metadata"
                    onTimeUpdate={() => setAudioCurrentTime(audioRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
                    onEnded={() => {
                        setIsPlaying(false)
                        setCurrentStatus("Audio finished")
                    }}
                    className="hidden"
                />
            )}
        </div>
    )
}


export default React.memo(SpeakingQuestion)


export const RecordingOnlyComponent = memo(({
    recordingDurationSeconds = 40,
    preRecordingWaitSeconds = 10,
    onRecordingComplete,
    onStartCountdown
}: any) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [countdown, setCountdown] = useState(-1);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [audioSizeKB, setAudioSizeKB] = useState(0);
    const [hasRecorded, setHasRecorded] = useState(false);
    const [status, setStatus] = useState("Ready");
    const [volume, setVolume] = useState(75);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const countdownTimerRef = useRef(null);
    const streamRef = useRef(null);

    // State for audio level
    const [audioLevel, setAudioLevel] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);

    const drawVisualizer = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set canvas size
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArray);
            
            // Clear canvas with light gray background like image
            ctx.fillStyle = '#e4e7ec'; // Light gray background
            ctx.fillRect(0, 0, width, height);
            
            // Calculate average audio level for state
            let sum = 0;
            let count = 0;
            for (let i = 0; i < Math.min(bufferLength, 64); i++) { // Use only low frequencies for voice
                sum += dataArray[i];
                count++;
            }
            const avg = count > 0 ? sum / count : 0;
            setAudioLevel(Math.min(100, (avg / 255) * 100));
            
            // Draw bars - thinner and more numerous like image
            const barCount = 60; // More bars for detailed look
            const barWidth = width / barCount;
            const spacing = 0.5;
            
            for (let i = 0; i < barCount; i++) {
                // Map bar index to frequency data
                const freqIndex = Math.floor((i / barCount) * bufferLength * 0.4); // Focus on lower frequencies
                const barHeight = (dataArray[freqIndex] / 255) * height;
                
                // Calculate position
                const x = i * barWidth;
                const y = height - barHeight;
                
                // Use the exact blue color from image: #4669e3
                const gradient = ctx.createLinearGradient(0, y, 0, height);
                gradient.addColorStop(0, '#ef4444'); // Top color
                gradient.addColorStop(0.5, '#f97316'); // Middle color
                gradient.addColorStop(1, '#eab308'); // Bottom color - same solid color
                
                ctx.fillStyle = gradient;
                
                // Draw rounded bar
                const barRadius = 1;
                const actualWidth = barWidth - spacing;
                
                // Rounded rectangle
                ctx.beginPath();
                ctx.moveTo(x + barRadius, y);
                ctx.lineTo(x + actualWidth - barRadius, y);
                ctx.quadraticCurveTo(x + actualWidth, y, x + actualWidth, y + barRadius);
                ctx.lineTo(x + actualWidth, height);
                ctx.lineTo(x, height);
                ctx.lineTo(x, y + barRadius);
                ctx.quadraticCurveTo(x, y, x + barRadius, y);
                ctx.closePath();
                ctx.fill();
            }
            
            // Add bottom border like in image
            ctx.fillStyle = '#e4e7ec';
            ctx.fillRect(0, height - 1, width, 1);
        };
        
        draw();
    }, []);

    const startVisualization = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            if (!canvasRef.current) return;
            
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const microphone = audioCtx.createMediaStreamSource(stream);
            
            analyser.fftSize = 512; // Higher for more detail
            analyser.minDecibels = -60;
            analyser.maxDecibels = -10;
            analyser.smoothingTimeConstant = 0.7;
            
            microphone.connect(analyser);
            
            analyserRef.current = analyser;
            audioContext.current = audioCtx;
            mediaStreamRef.current = stream;
            
            drawVisualizer();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }, [drawVisualizer]);

    const stopVisualization = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        
        if (analyserRef.current && audioContext.current) {
            analyserRef.current.disconnect();
        }
        
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        setAudioLevel(0);
    }, []);

    // Start/stop visualization based on recording state
    useEffect(() => {
        if (isRecording) {
            startVisualization();
        } else {
            stopVisualization();
        }
        
        return () => {
            stopVisualization();
        };
    }, [isRecording, startVisualization, stopVisualization]);

    // Initialize audio context for beeps
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        return () => {
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        };
    }, [audioPreviewUrl]);

    const startCountdown = () => {
        if (hasRecorded) return;
        setStatus("Preparing to record...");
        let count = preRecordingWaitSeconds;
        setCountdown(count);

        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        countdownTimerRef.current = setInterval(() => {
            count--;
            setCountdown(count);

            if (count <= 3 && count > 0) {
                playBeep(600, 0.2);
                setStatus(`Starting in ${count}...`);
            }

            if (count <= 0) {
                clearInterval(countdownTimerRef.current);
                setCountdown(-1);
                playBeep(800, 0.5);
                setTimeout(() => {
                    startRecording();
                }, 500);
            }
        }, 1000);
    };

    const playBeep = (freq, duration) => {
        try {
            const ctx = audioContextRef.current;
            if (ctx.state === "suspended") ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.value = 0.3;

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("Beep sound failed:", e);
        }
    };

    const startRecording = async () => {
        if (hasRecorded) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 24000,
                },
            });
            streamRef.current = stream;

            const mimeType = "audio/webm;codecs=opus";
            const options = {
                mimeType,
                audioBitsPerSecond: 32000,
            };

            mediaRecorderRef.current = new MediaRecorder(stream, options);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(blob);
                setAudioPreviewUrl(url);
                setAudioSizeKB((blob.size / 1024).toFixed(2));
                setHasRecorded(true);
                setStatus("Recording complete");
                if (onRecordingComplete) onRecordingComplete(blob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            setStatus("Recording...");

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= 5 - 1) {
                        clearInterval(recordingTimerRef.current);
                        if (mediaRecorderRef.current?.state === "recording") {
                            mediaRecorderRef.current.stop();
                        }
                        setIsRecording(false);
                        return recordingDurationSeconds;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (error) {
            console.error("Recording failed:", error);
            setStatus("Microphone access denied");
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (onStartCountdown) {
            onStartCountdown(startCountdown);
        }
    }, [onStartCountdown]);

    return (
        <div className="space-y-6">
            {/* Countdown */}
            {countdown >= 0 && (
                <div className="flex items-center justify-center gap-4 p-6 rounded-lg text-center">
                    <div className="relative">
                        <div className="relative w-16 h-16 rounded-full border-4 border-slate-500 dark:border-slate-700 bg-white flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-400 dark:text-orange-400">
                                {countdown}
                            </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-400 mb-1">
                            Recording in {countdown} seconds
                        </h3>
                    </div>
                </div>
            )}

            {/* Recording in progress */}
            {isRecording && (
                <div className="bg-gray-200 p-4 rounded-xl shadow-lg w-[50%] mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <Mic className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-semibold text-black tracking-wide">
                                RECORDING LIVE
                            </span>
                        </div>
                        <span className="text-xs text-black">Speak clearly</span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                        <div className="w-full bg-white rounded-full h-4 overflow-hidden">
                            <div
                                className="h-full bg-gray-500 transition-all"
                                style={{
                                    width: `${(recordingTime / recordingDurationSeconds) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Audio Visualizer */}
                    <div className="mb-4">
                        
                        
                        {/* Canvas container with border like image */}
                    
                            <canvas 
                                ref={canvasRef}
                                className="w-full h-16"
                            />
                        
                        
                       
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-black">
                            Your voice is being recorded
                        </span>
                        <span className="text-xs text-gray-600">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                </div>
            )}

            {/* Recording preview */}
            {audioPreviewUrl && hasRecorded && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
                        ✓ Your voice has been recorded
                    </h3>
                </div>
            )}
        </div>
    );
});
// TTSPlayerWithUI.tsx
interface TTSPlayerWithUIProps {
    audioUrl?: string;
    text: string;
    delayBeforePlay?: number; // ms, default 0
    onPlaybackEnd?: () => void;
    voiceNamePattern?: RegExp;
    rate?: number;
    pitch?: number;
    volume?: number; // initial volume 0-1, default 1.0
}

const TTSPlayerWithUI: React.FC<TTSPlayerWithUIProps> = ({
    audioUrl,
    text,
    delayBeforePlay = 0,
    onPlaybackEnd,
    initialVolume = 1,
    voiceNamePattern = /female|zira|jane|ava|samantha/i,
    rate = 0.9,
    pitch = 1,
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(initialVolume);

    const isUsingTTS = !audioUrl && !!text; // 🔑 decision flag

    /* 🔊 Start Playback (API OR TTS) */
    const startPlayback = () => {
        /* 🎧 API AUDIO */
        if (audioUrl && audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        /* 🔊 TTS FALLBACK */
        if (!text) return;

        window.speechSynthesis.cancel();

        const speak = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = volume;

            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => voiceNamePattern.test(v.name));
            if (preferred) utterance.voice = preferred;

            utterance.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
                onPlaybackEnd?.();
            };

            utterance.onerror = () => {
                setIsPlaying(false);
                setIsPaused(false);
                onPlaybackEnd?.();
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        };

        // 🔑 KEY FIX: wait for voices
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = speak;
        } else {
            speak();
        }
    };


    useEffect(() => {
        if (!audioUrl && !text) return;

        if (delayBeforePlay > 0) {
            const totalSeconds = Math.ceil(delayBeforePlay / 1000);
            setCountdown(totalSeconds);

            let remaining = totalSeconds;

            const interval = setInterval(() => {
                remaining -= 1;
                setCountdown(remaining);

                if (remaining <= 0) {
                    clearInterval(interval);
                    setCountdown(null);
                    startPlayback();
                }
            }, 1000);

            return () => clearInterval(interval);
        } else {
            startPlayback();
        }
    }, [audioUrl, text, delayBeforePlay]);



    /* 🔊 Volume sync */
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
        if (utteranceRef.current) utteranceRef.current.volume = volume;
    }, [volume]);





    const progress =
        !isUsingTTS && duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-gray-200 p-5 rounded-lg border border-blue-200 shadow-sm">

            {/* Header */}
            <div className="flex justify-between mb-4 text-black">
                <span className="font-bold">
                    {isUsingTTS ? "TEXT TO SPEECH" : "AUDIO PLAYBACK"}
                </span>
                {countdown !== null && <span>Starting in {countdown}s</span>}
            </div>

            {/* Progress (audio only) */}
            {!isUsingTTS && (
                <div className="mb-4">
                    <div className="w-full bg-white/40 h-4 rounded-full overflow-hidden">
                        <div
                            className="bg-slate-500 h-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">


                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(+e.target.value)}
                    className="w-24"
                />
            </div>

            {/* 🎧 REAL AUDIO (only if audioUrl exists) */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="metadata"
                    onTimeUpdate={() =>
                        setCurrentTime(audioRef.current?.currentTime || 0)
                    }
                    onLoadedMetadata={() =>
                        setDuration(audioRef.current?.duration || 0)
                    }
                    onEnded={() => {
                        setIsPlaying(false);
                        setIsPaused(false);
                        onPlaybackEnd?.();
                    }}
                />
            )}
        </div>
    );
};



export const TTSPlayer = TTSPlayerWithUI