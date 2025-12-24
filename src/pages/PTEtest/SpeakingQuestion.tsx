import React, { useState, useEffect, useRef, useCallback, memo } from "react"
import { Volume2, Mic, Clock, Volume2Icon, Play, Pause, StopCircle } from "lucide-react"

const SpeakingQuestion = ({ qDoc }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [countdown, setCountdown] = useState(-1)
    const [currentStatus, setCurrentStatus] = useState("Preparing...")
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
    const [audioSize, setAudioSize] = useState(0)
    const [ttsProgress, setTtsProgress] = useState(0)
    const [estimatedTtsDuration, setEstimatedTtsDuration] = useState(0)
    const [hasPlayedTTS, setHasPlayedTTS] = useState(false)
    const [hasRecorded, setHasRecorded] = useState(false)

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const audioContextRef = useRef(null)
    const recordingTimerRef = useRef(null)
    const countdownTimerRef = useRef(null)
    const ttsTimerRef = useRef(null)

    const questionText = qDoc?.typeSpecific?.listeningText || qDoc?.questionText || "No question available"
    const hasValidQuestion = Boolean(qDoc && (qDoc.typeSpecific?.listeningText || qDoc.questionText))

    // Initialize audio context and auto-play TTS once
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()

        // Auto-play TTS after 1 second (ONLY ONCE)
        setTimeout(() => {
            if (hasValidQuestion && !hasPlayedTTS) {
                playTTS()
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
        }
    }, [])

    // Play TTS with progress simulation (ONE TIME ONLY)
    const playTTS = () => {
        if (hasPlayedTTS) return // Prevent replay

        if (!hasValidQuestion) {
            setCurrentStatus("No question text available")
            return
        }

        setHasPlayedTTS(true) // Mark as played
        const estimatedDuration = Math.max(2, questionText.length / 150)
        setEstimatedTtsDuration(estimatedDuration)
        setTtsProgress(0)
        setIsPlaying(true)
        setCurrentStatus("Playing question...")

        // Cancel any existing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(questionText)

        // Select female voice
        const voices = window.speechSynthesis.getVoices()
        const femaleVoice = voices.find((v) => /female|samantha|zira|jane|serena|karen|ava|tessa/i.test(v.name))
        if (femaleVoice) utterance.voice = femaleVoice

        utterance.rate = 0.7
        utterance.pitch = 0.7
        utterance.volume = 0.9

        // Simulate progress
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

        window.speechSynthesis.speak(utterance)
    }

    // Start 10-second countdown
    const startCountdown = () => {
        if (hasRecorded) return // Prevent re-recording

        setCurrentStatus("Preparing to record...")
        let count = 10
        setCountdown(count)

        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)

        countdownTimerRef.current = setInterval(() => {
            count--
            setCountdown(count)

            if (count <= 3 && count > 0) {
                playBeep(600, 0.2) // Short beep for last 3
                setCurrentStatus(`Starting in ${count}...`)
            }

            if (count <= 0) {
                clearInterval(countdownTimerRef.current)
                setCountdown(-1)
                playBeep(800, 0.5) // Long beep to start recording
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
        if (hasRecorded) return // Prevent re-recording

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
                setHasRecorded(true) // Mark as recorded
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
        <div className="bg-white dark:bg-slate-900 pt-4 rounded-lg min-h-[65vh] overflow-y-auto">
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


            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                        <Volume2 className={`w-5 h-5 ${isPlaying ? "text-blue-600 animate-pulse" : "text-blue-500"}`} />
                        <span className="font-semibold text-blue-900 dark:text-blue-100">Question Audio (Plays Once)</span>
                    </div>

                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Progress</span>
                        <span>
                            {ttsProgress.toFixed(1)}s / {estimatedTtsDuration.toFixed(1)}s
                        </span>
                    </div>

                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                        <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-100"
                            style={{ width: `${Math.min(100, (ttsProgress / estimatedTtsDuration) * 100)}%` }}
                        />
                    </div>

                    <div className="mt-3 text-sm flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span
                            className={`px-2 py-1 rounded ${isPlaying
                                ? "bg-blue-200 dark:bg-blue-800"
                                : hasPlayedTTS
                                    ? "bg-green-200 dark:bg-green-800"
                                    : "bg-gray-200 dark:bg-gray-700"
                                }`}
                        >
                            {currentStatus}
                        </span>
                    </div>

                    {hasPlayedTTS && !isPlaying && (
                        <p className="mt-2 text-xs text-blue-700 dark:text-blue-300 font-medium">
                            ⚠️ Question has been played. No replay allowed.
                        </p>
                    )}
                </div>

                {/* Countdown Display */}
                {countdown >= 0 && (
                    <div className="">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600 animate-pulse" />
                            <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-2">Get Ready!</h3>
                            <p className="text-5xl font-bold text-orange-600 dark:text-orange-400">{countdown}</p>
                            <p className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                                Recording starts in {countdown} second{countdown !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                )}

                {/* Recording Display */}
                {isRecording && (
                    <div className="">
                        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Mic className="w-6 h-6 text-red-600 animate-pulse" />
                                <h3 className="text-xl font-bold text-red-900 dark:text-red-100">RECORDING IN PROGRESS</h3>
                                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                            </div>

                            <div className="text-center mb-4">
                                <p className="text-4xl font-bold text-red-600 dark:text-red-400">{formatTime(recordingTime)}</p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    Time remaining: {formatTime(40 - recordingTime)}
                                </p>
                            </div>

                            <div className="w-full bg-red-200 dark:bg-red-800 rounded-full h-3">
                                <div
                                    className="bg-red-600 h-3 rounded-full transition-all duration-1000"
                                    style={{ width: `${(recordingTime / 40) * 100}%` }}
                                />
                            </div>

                            <p className="mt-3 text-xs text-center text-red-700 dark:text-red-300 font-medium">
                                Recording will automatically stop at 40 seconds
                            </p>
                        </div>
                    </div>
                )}

                {/* Recording Preview (No Replay of Question) */}
                {audioPreviewUrl && hasRecorded && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">
                            ✓ Your Recording (Final - No Re-record Allowed)
                        </h3>

                        <audio controls className="w-full mb-4" src={audioPreviewUrl} />

                        <div className="flex flex-wrap justify-between items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded border border-green-200 dark:border-green-700">
                            <div className="text-sm">
                                <p className="font-semibold mb-1">Recording Details:</p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Format: WebM/Opus • Duration: 40s • Size: {audioSize} KB
                                </p>
                            </div>
                            <button
                                onClick={downloadAudio}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Download Recording
                            </button>
                        </div>
                    </div>
                )}

            </div>

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

    // 👇 NEW: Expose startCountdown as a controlled action via parent
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
                playBeep(600, 0.2); // Short beep for 3, 2, 1
                setStatus(`Starting in ${count}...`);
            }

            if (count <= 0) {
                clearInterval(countdownTimerRef.current);
                setCountdown(-1);
                // 🔊 BEEP just before recording starts!
                playBeep(800, 0.5); // Longer, higher beep to signal "GO"
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

            // Auto-stop after recordingDurationSeconds
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= recordingDurationSeconds - 1) {
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

    // 👇 NEW: Once mounted, notify parent that it can start the countdown
    useEffect(() => {
        if (onStartCountdown) {
            onStartCountdown(startCountdown); // Pass the function up
        }
    }, [onStartCountdown]);

    return (
        <div className="space-y-6">
            {/* Countdown */}
            {countdown >= 0 && (
                <div className="flex items-center justify-center gap-4 p-6 rounded-lg text-center">
                    <div className="relative">


                        {/* Countdown circle */}
                        <div className="relative w-16 h-16 rounded-full border-4 border-slate-500 dark:border-slate-700 bg-white  flex items-center justify-center ">
                            <span className="text-2xl font-bold text-slate-400  dark:text-orange-400">
                                {countdown}
                            </span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-slate-400  mb-1">
                            Recording in {countdown} seconds
                        </h3>

                    </div>
                </div>
            )}

            {/* Recording in progress */}
            {isRecording && (
                <div className="
    bg-gray-200
    p-4 rounded-xl
    shadow-lg
  ">

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

                        <span className="text-xs text-black">
                            Speak clearly
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                        <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gray-500 transition-all"
                                style={{
                                    width: `${(recordingTime / recordingDurationSeconds) * 100}%`,
                                }}
                            />
                        </div>

                       
                    </div>

                    

                    {/* Controls */}
                    <div className="flex items-center justify-between">

                        {/* Status */}
                        <span className="text-xs text-black">
                            Your voice is being recorded
                        </span>

                        {/* Volume */}
                        <div className="flex items-center gap-2">

                            {/* Mute */}
                            <button
                                onClick={() => setVolume(volume === 0 ? 70 : 0)}
                                className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition"
                            >
                                {volume === 0 ? (
                                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.707 7.293a1 1 0 00-1.414 1.414L13.586 10l-2.293 2.293a1 1 0 001.414 1.414L15 11.414l2.293 2.293a1 1 0 001.414-1.414L16.414 10l2.293-2.293a1 1 0 00-1.414-1.414L15 8.586l-2.293-2.293z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-slate-200" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" />
                                    </svg>
                                )}
                            </button>

                            {/* Slider */}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(+e.target.value)}
                                className="w-16 h-1 accent-red-400 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            )}


            {/* Recording preview */}
            {audioPreviewUrl && hasRecorded && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
                        ✓ Your Response (Final)
                    </h3>
                    <audio controls className="w-full mb-3" src={audioPreviewUrl} />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Duration: {recordingDurationSeconds}s • Size: {audioSizeKB} KB
                    </p>
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
                    <div className="w-full bg-white/40 h-3 rounded-full overflow-hidden">
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