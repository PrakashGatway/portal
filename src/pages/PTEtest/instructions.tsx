import React, { useEffect, useRef, useState } from 'react';
import Button from "../../components/ui/button/Button";
import { Save, ChevronLeft, ChevronRight, Volume2, Headphones, Play, Square, VolumeX, RefreshCw } from 'lucide-react';

interface IntroScreenProps {
    introPage: number;
    setIntroPage: (page: number) => void;
    setCurrentScreen: (screen: string) => void;
}

export const PteIntroScreen: React.FC<IntroScreenProps> = React.memo(
    ({ introPage, setIntroPage, setCurrentScreen }) => {



        const audioStreamRef = useRef(null);

        const mediaRecorderRef = useRef<MediaRecorder | null>(null);
        const audioRef = useRef<HTMLAudioElement | null>(null);
        const chunksRef = useRef<Blob[]>([]);

        const [recording, setRecording] = useState(false);
        const [audioURL, setAudioURL] = useState<string | null>(null);
        const timerRef = useRef(null);
        const [isPlaying, setIsPlaying] = useState(false);

        const SW_PREP_TIME = 25;
        const SW_RECORD_TIME = 30;

        const [swPhase, setSwPhase] = useState<"prep" | "recording" | "done">("prep");
        const [swPrepLeft, setSwPrepLeft] = useState(SW_PREP_TIME);
        const [swRecordLeft, setSwRecordLeft] = useState(SW_RECORD_TIME);
        const [swAudioURL, setSwAudioURL] = useState<string | null>(null);

        const [showRecordingAlert, setShowRecordingAlert] = useState(false);





        const swStreamRef = useRef<MediaStream | null>(null);
        const swRecorderRef = useRef<MediaRecorder | null>(null);
        const swChunksRef = useRef<Blob[]>([]);
        const swAudioRef = useRef<HTMLAudioElement | null>(null);


        const utteranceRef = useRef(null);

        useEffect(() => {
            if (recording) {
                timerRef.current = setInterval(() => {
                    setTime((t) => t + 1);
                }, 1000);
            }

            return () => {
                clearInterval(timerRef.current);
            };
        }, [recording]);

        // 🚨 FORCE CLEANUP on unmount / section change
        useEffect(() => {
            return () => {
                forceStopRecording();
            };
        }, []);

        const startRecording = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioStreamRef.current = stream; // ✅ SAVE STREAM

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioURL(URL.createObjectURL(blob));
            };

            recorder.start();
            setRecording(true);
        };


        const stopRecording = () => {
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
            }

            audioStreamRef.current?.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;

            setRecording(false);
        };

        const playAudio = () => {
            if (!audioRef.current) return;

            if (isPlaying) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        };



        const forceStopRecording = () => {
            try {
                // stop recorder
                if (mediaRecorderRef.current?.state === "recording") {
                    mediaRecorderRef.current.stop();
                }
                mediaRecorderRef.current = null;

                // 🔥 HARD STOP MIC
                audioStreamRef.current?.getTracks().forEach(track => track.stop());
                audioStreamRef.current = null;

                // stop playback
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }

                setRecording(false);
                setIsPlaying(false);
                setAudioURL(null);
            } catch (e) {
                console.error("forceStopRecording error", e);
            }
        };


        useEffect(() => {
            return () => {
                forceStopRecording();
            };
        }, []);






        const swStartRecording = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            swStreamRef.current = stream;

            const recorder = new MediaRecorder(stream);
            swRecorderRef.current = recorder;
            swChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) swChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(swChunksRef.current, { type: "audio/webm" });
                setSwAudioURL(URL.createObjectURL(blob));
                stream.getTracks().forEach(t => t.stop());
            };

            recorder.start();
            setSwPhase("recording");
        };


        const swStopRecording = () => {
            if (swRecorderRef.current?.state === "recording") {
                swRecorderRef.current.stop();
            }

            swStreamRef.current?.getTracks().forEach(t => t.stop());
            swStreamRef.current = null;

            setSwPhase("done");
        };


        const swForceStop = () => {
            if (swRecorderRef.current?.state === "recording") {
                swRecorderRef.current.stop();
            }

            swStreamRef.current?.getTracks().forEach(t => t.stop());
            swStreamRef.current = null;

            if (swAudioRef.current) {
                swAudioRef.current.pause();
                swAudioRef.current.currentTime = 0;
            }


        };
















        const checklist = [
            {
                icon: "📝",
                text: "Use pen and paper to take notes. A whiteboard and pen is provided for the live test.",
            },
            {
                icon: "🎧",
                text: "We recommend a headset as these are used in the live test but these are not essential for this test.",
            },
            {
                icon: "⌨️",
                text: "We recommend a QWERTY keyboard as these are used in the live test, but this is not essential for this test.",
            },
            {
                icon: "🔇",
                text: "Choose a quiet location where you won’t get interrupted.",
            },
            {
                icon: "📶",
                text: "Ensure strong and consistent WIFI connection.",
            },
        ];








        const introPages = [
            {

                content: (
                    <div className="flex flex-col lg:flex-row gap-8 items-center">

                        <div className="lg:w-1/2 space-y-4">

                            <p>
                                Please click <span className='font-bold'>Next</span> When you are ready to begin the test.
                            </p>







                        </div>
                    </div>
                ),
            },
            {
                title: "",
                content: (
                    <main className="mx-auto flex justify-center w-xl bg-gray-100 p-2">
                        <div className="w-full max-w-xl">

                            <h2 className="text-lg font-semibold text-center mb-6">
                                Test Checklist
                            </h2>

                            <ul className="space-y-4 text-lg text-gray-700">
                                {checklist.map((item, index) => (
                                    <li key={index} className="flex gap-3">
                                        <span className="text-lg">{item.icon}</span>
                                        <span>{item.text}</span>
                                    </li>
                                ))}
                            </ul>

                        </div>
                    </main>
                ),
            },
            {
                title: "",
                content: (
                    <main className="mx-auto flex justify-center bg-gray-100 p-4 w-xl pt-12">
                        <div className="w-full max-w-xl ">

                            <img
                                src="/images/logo/microphone.jpg"
                                alt="Mic test"
                                className="mx-auto mb-4 w-70 h-50"
                            />

                            <p className="text-base mb-4">
                                You must check your microphone before clicking next and continuing with the test.
                            </p>

                            <ol className="text-base text-left space-y-2 text-gray-700">
                                <li>1. Make sure your Microphone is on.</li>
                                <li>
                                    2. When you are ready, click on the Record button and say
                                    <em className="italic">
                                        {" "}
                                        "The man felt poorly so he decided to take some medicine and go to bed."
                                    </em>
                                </li>
                                <li>3. After you have spoken, click on the Stop button.</li>
                                <li>4. Click on the Playback button to hear yourself.</li>
                                <li>
                                    5. If the sound is unclear, adjust microphone position or settings.
                                </li>
                            </ol>

                            {/* ===== RECORD CONTROLS (PTE STYLE) ===== */}
                            <div className="mt-6 flex justify-center gap-4">

                                {!recording ? (
                                    <button
                                        onClick={startRecording}
                                        className="border px-6 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200"
                                    >
                                        ● Record
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="border px-6 py-2 rounded text-sm bg-gray-200"
                                    >
                                        ■ Stop
                                    </button>
                                )}

                                <button
                                    onClick={playAudio}
                                    disabled={!audioURL}
                                    className={`border px-6 py-2 rounded text-sm ${audioURL
                                        ? "bg-gray-100 hover:bg-gray-200"
                                        : "bg-gray-50 text-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    {isPlaying ? "■ Stop" : "▶ Playback"}
                                </button>


                            </div>

                            {audioURL && <audio
                                ref={audioRef}
                                src={audioURL || undefined}
                                onEnded={() => setIsPlaying(false)}
                            />
                            }

                        </div>
                    </main>

                ),
            },
            {

                content: (
                    <main className="flex-1 flex flex-col items-center ">

                        {/* Title */}
                        <h2 className="text-lg font-semibold mb-1">
                            Test Format
                        </h2>

                        <p className="text-sm text-gray-600 mb-6">
                            This test is approximately 2 hours long.
                        </p>

                        {/* ===== TABLE ===== */}
                        <table className="border border-gray-300 text-sm mb-10">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border px-4 py-2 font-semibold">Part</th>
                                    <th className="border px-4 py-2 font-semibold">Content</th>
                                    <th className="border px-4 py-2 font-semibold">Time Allowed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border px-4 py-2">Intro</td>
                                    <td className="border px-4 py-2">Introduction</td>
                                    <td className="border px-4 py-2">Not timed</td>
                                </tr>
                                <tr>
                                    <td className="border px-4 py-2">Part 1</td>
                                    <td className="border px-4 py-2">Speaking and Writing</td>
                                    <td className="border px-4 py-2">77 Minutes</td>
                                </tr>
                                <tr>
                                    <td className="border px-4 py-2">Part 2</td>
                                    <td className="border px-4 py-2">Reading</td>
                                    <td className="border px-4 py-2">25 Minutes</td>
                                </tr>
                                <tr>
                                    <td className="border px-4 py-2">Part 3</td>
                                    <td className="border px-4 py-2">Listening</td>
                                    <td className="border px-4 py-2">31 Minutes</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ===== INFO BOX ===== */}
                        <div className="bg-gray-100 px-8 py-6 rounded text-center max-w-lg">
                            <div className="flex justify-center items-center gap-2 mb-2 text-gray-700">
                                <span className="text-xl">🕒</span>
                                <span className="font-semibold">How the timer works</span>
                            </div>

                            <p className="text-sm text-gray-600">
                                This test has 3 main parts or sections.
                            </p>

                            <p className="text-sm text-gray-600 mt-2">
                                When you start each part, a timer will appear in the top right
                                corner. It shows how much time you have left to complete the
                                section.
                            </p>
                        </div>

                    </main>
                ),
            },
            {
                title: "",
                content: (
                    <main className="flex-1 flex justify-center items-start ">

                        {/* Grey Info Box */}
                        <div className="bg-gray-100 px-10 py-8 rounded text-center max-w-lg">

                            <h2 className="text-lg font-semibold mb-4">
                                Ready to start the test?
                            </h2>

                            <div className="flex items-start gap-3 text-sm text-gray-700 mb-4">
                                <span className="text-lg">🕒</span>
                                <p className="text-left">
                                    Starting the test will initiate the timer. You will have
                                    approximately 2 hours.
                                </p>
                            </div>

                            <div className="flex items-start gap-3 text-sm text-gray-700">
                                <span className="text-lg">💾</span>
                                <p className="text-left">
                                    You can pause the test at any time and resume by using the
                                    "Save/Exit" button.
                                </p>
                            </div>

                        </div>

                    </main>
                ),
            },
            {
                title: "Personal Introduction",
                content: (
                    <div className=" gap-10 items-start">

                        {/* ===== LEFT CONTENT (Instruction Text) ===== */}
                        <div className="flex-1 pr-10 text-gray-800 text-sm leading-relaxed">
                            <p className="mb-4">
                                Read the prompt below. In 25 seconds, you must reply in your own words,
                                as naturally and clearly as possible. You have 30 seconds to record
                                your response. Your response will be sent together with your score
                                report to the institutions selected by you.
                            </p>

                            <p className="mb-2">
                                Please introduce yourself. For example, you could talk about one of
                                the following.
                            </p>

                            <ul className="list-disc pl-6 space-y-1">
                                <li>Your interests</li>
                                <li>Your plans for future study</li>
                                <li>Why you want to study abroad</li>
                                <li>Why you need to learn English</li>
                                <li>Why you chose this test</li>
                            </ul>
                        </div>

                        {/* ===== RIGHT CONTENT (Audio Recorder – Isolated Logic) ===== */}
                        <div className="w-[360px] mt-4 border border-gray-300 bg-gray-50">

                            <div className="text-center text-sm py-3 border-b font-medium">
                                Audio Recorder
                            </div>

                            {swPhase === "prep" && (
                                <div className="text-center text-sm text-red-600 py-4">
                                    Recording in {swPrepLeft}
                                </div>
                            )}

                            {swPhase === "recording" && (
                                <div className="text-center text-sm text-red-600 py-4">
                                    🔴 Recording…
                                </div>
                            )}

                            {swPhase === "done" && (
                                <div className="text-center text-sm text-green-600 py-4">
                                    ✔ Recording Complete
                                </div>
                            )}

                            <div className="px-4 pb-4">
                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span>
                                        {swPhase === "recording"
                                            ? `${SW_RECORD_TIME - swRecordLeft} / ${SW_RECORD_TIME}`
                                            : `0 / ${SW_RECORD_TIME}`}
                                    </span>
                                </div>

                                <div className="h-2 bg-gray-200 rounded">
                                    <div
                                        className="h-2 bg-gray-400 rounded transition-all"
                                        style={{
                                            width:
                                                swPhase === "recording"
                                                    ? `${((SW_RECORD_TIME - swRecordLeft) / SW_RECORD_TIME) * 100}%`
                                                    : "0%",
                                        }}
                                    />
                                </div>
                            </div>

                            {swAudioURL && (
                                <audio ref={swAudioRef} src={swAudioURL} />
                            )}
                        </div>

                    </div>


                ),
            },
            {
                title: "",
                content: (
                    <div className="flex flex-col lg:flex-row gap-8 items-center">

                        <div className="lg:w-1/2 space-y-4">

                            <p>
                                Please click <span className='font-bold'>Next</span> When you are ready to begin the test.
                            </p>







                        </div>
                    </div>
                ),
            },
        ];

        const maxPage = introPages.length;
        const page = Math.min(introPage, maxPage);

        const PERSONAL_INTRO_PAGE = 6; // confirm once with console.log(page)
        const isPersonalIntroPage = page === PERSONAL_INTRO_PAGE;

        const isLast = page === maxPage;
        const current = introPages[page - 1];

        const isMicTestPage = page === 3;          // mic test page index
        const isSpeakingIntroPage = page === 6;   // personal introduction page index

        const isRecordingPage = isMicTestPage || isSpeakingIntroPage;

        const isMicTestComplete = isMicTestPage ? !!audioURL : true;
        const isSpeakingComplete = isSpeakingIntroPage ? swPhase === "done" : true;

        const canProceed = isMicTestComplete && isSpeakingComplete;


        useEffect(() => {
            if (!isPersonalIntroPage) return;
            if (swPhase !== "prep") return;

            const timer = setInterval(() => {
                setSwPrepLeft((t) => {
                    if (t === 1) {
                        clearInterval(timer);
                        swStartRecording();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }, [swPhase, isPersonalIntroPage]);



        useEffect(() => {
            if (!isPersonalIntroPage) return;
            if (swPhase !== "recording") return;

            const timer = setInterval(() => {
                setSwRecordLeft((t) => {
                    if (t === 1) {
                        clearInterval(timer);
                        swStopRecording();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }, [swPhase, isPersonalIntroPage]);


        useEffect(() => {
            return () => {
                swForceStop();
            };
        }, []);

        useEffect(() => {
            if (isPersonalIntroPage) {
                setSwPhase("prep");
                setSwPrepLeft(SW_PREP_TIME);
                setSwRecordLeft(SW_RECORD_TIME);
                setSwAudioURL(null);
            }
        }, [isPersonalIntroPage]);



        return (
            <div className=" bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">


                {/* Main Content */}
                <div className="max-w-7xl mx-auto p-6">
                    <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {current.title}
                    </h2>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        {current.content}
                    </div>
                </div>

                {/* Fixed bottom navigation */}
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    onClick={() => null}
                                    disabled={true}
                                >
                                    <Save className="h-4 w-4" />
                                    Save
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">

                                <Button
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-[#0080a3] px-5 py-2 text-sm font-semibold text-white"
                                    onClick={() => {

                                        // 🚨 BLOCK navigation if recording not done
                                        if (isRecordingPage && !canProceed) {
                                            setShowRecordingAlert(true);
                                            return;
                                        }

                                        // safe cleanup
                                        forceStopRecording();
                                        swForceStop();

                                        if (isLast) {
                                            setCurrentScreen("question");
                                        } else {
                                            setIntroPage((p) => p + 1);
                                        }
                                    }}
                                >
                                    {isLast ? "Begin Test" : "Next"}
                                    {!isLast && <ChevronRight className="h-4 w-4" />}
                                </Button>

                            </div>
                        </div>
                    </div>
                </div>


                {showRecordingAlert && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setShowRecordingAlert(false)}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-xl shadow-xl w-[360px] p-6">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">
                                Recording Required
                            </h3>

                            <p className="text-sm text-gray-600 mb-5">
                                Please complete the recording before moving to the next section.
                            </p>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowRecordingAlert(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        );
    }
);