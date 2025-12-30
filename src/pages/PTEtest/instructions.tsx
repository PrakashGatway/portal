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


        const mediaRecorderRef = useRef(null);
        const audioStreamRef = useRef(null); // ✅ renamed (no conflict)
        const chunksRef = useRef([]);

        const [recording, setRecording] = useState(false);
        const [time, setTime] = useState(0);
        const [audioURL, setAudioURL] = useState(null);
        const audioRef = useRef(null);



        const streamRef = useRef(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [timeLeft, setTimeLeft] = useState(10);
        const timerRef = useRef(null);
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
            audioStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioURL(URL.createObjectURL(blob));
            };

            mediaRecorderRef.current.start();
            setRecording(true);
            setTime(0);
            setAudioURL(null);
        };

        const stopRecording = () => {
            mediaRecorderRef.current?.stop();
            audioStreamRef.current?.getTracks().forEach((track) => track.stop());
            setRecording(false);
        };

        // 🧹 Hard stop (used for cleanup)
        const forceStopRecording = () => {
            try {
                clearInterval(timerRef.current);

                if (mediaRecorderRef.current?.state === "recording") {
                    mediaRecorderRef.current.stop();
                }

                audioStreamRef.current?.getTracks().forEach((track) => track.stop());

                mediaRecorderRef.current = null;
                audioStreamRef.current = null;
            } catch (e) {
                console.warn("Recording cleanup error", e);
            }
        };







        const startTest = () => {
            if (isPlaying) return;

            // Stop any previous speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(
                "This is a headphone test. Please adjust your volume to a comfortable level. The test will end automatically."
            );

            utterance.lang = "en-US";
            utterance.rate = 0.9;   // natural speed
            utterance.pitch = 1;
            utterance.volume = 1;

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);

            setIsPlaying(true);
            setTimeLeft(10);

            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === 1) {
                        stopTest();
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        const stopTest = () => {
            window.speechSynthesis.cancel();
            clearInterval(timerRef.current);
            setIsPlaying(false);
            setTimeLeft(10);
        };

        useEffect(() => {
            return () => stopTest();
        }, []);



        const introPages = [
            {

                content: (
                    <div className="flex flex-col lg:flex-row gap-8 items-center">

                        <div className="lg:w-1/2 space-y-4">

                            <p>
                                The test is approximately <span className="font-bold text-blue-600">2.5 hours long</span> including all parts.
                            </p>



                            <table className="w-full border border-slate-400 dark:border-slate-500">
                                <tr className="border-b border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-700">
                                    <th className="p-3 text-left border-r border-slate-400 dark:border-slate-500">Part</th>
                                    <th className="p-3 text-left border-r border-slate-400 dark:border-slate-500">Content</th>
                                    <th className="p-3 text-left">Time allowed</th>
                                </tr>
                                <tr className="border-b border-slate-300 dark:border-slate-600">
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-600">Intro</td>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-600">Introduction</td>
                                    <td className="p-3">-</td>
                                </tr>
                                <tr className="border-b border-slate-300 dark:border-slate-600">
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-600">Part 1</td>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-600">Speaking and Writing</td>
                                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">70 minutes</td>
                                </tr>
                                <tr className="border-b border-slate-300 dark:border-slate-600">
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-600">Part 2</td>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-600">Reading</td>
                                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">26 minutes</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-600">Part 3</td>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-600">Listening</td>
                                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">31 minutes</td>
                                </tr>
                            </table>



                        </div>
                    </div>
                ),
            },
            {
                title: "Headset",
                content: (
                    <div className="flex flex-col lg:flex-row gap-3 justify-between items-center">

                        <div className="lg:w-1/2 space-y-6">
                            <p>
                                Check this is an opportunity to check that your headset is working correctly.
                            </p>
                            <ol className="space-y-4 pl-4">
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold">1</span>
                                    <p>Put your headset on and adjust so that it fits comfortably over your ears.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold">2</span>
                                    <p>When ready, click on the [Play] button. You will hear a short recording.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold">3</span>
                                    <p>If you don't hear anything in your headphones while the status reads [playing], raise your hand to get the attention of the test Administrator.</p>
                                </li>
                            </ol>


                            <div className="w-[520px] bg-[#4aa3bf] p-6 rounded-md text-white">

                                {/* PLAYER BAR */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={isPlaying ? stopTest : startTest}
                                        className="text-xl font-bold"
                                    >
                                        {isPlaying ? "⏸" : "▶"}
                                    </button>


                                    {/* Fake progress bar */}
                                    <div className="w-full h-2 bg-white/40 rounded">
                                        <div
                                            className="h-2 bg-white rounded transition-all"
                                            style={{ width: `${((10 - timeLeft) / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <p className="text-sm mt-3">
                                    Click the play button to start
                                </p>


                            </div>



                        </div>

                        <div className='mr-14' ><img className='w-[300px]' src="/images/logo/headphones.png" alt="" /></div>

                    </div>
                ),
            },
            {
                title: "Microphone Check",
                content: (
                    <div className="flex flex-col lg:flex-row gap-8 items-center">

                        <div className="lg:w-1/2 space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Check that your microphone is working correctly
                            </h3>
                            <ol className="space-y-4 pl-4">
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold">1</span>
                                    <p>Make sure your headset is on and microphone is near your mouth.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold">2</span>
                                    <p>Click Record and say "Testing, testing, one, two, three" into the microphone.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold">3</span>
                                    <p>Click Stop after speaking.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold">4</span>
                                    <p>Click Playback to hear your recording clearly.</p>
                                </li>
                            </ol>



                            <div className="bg-white p-2 rounded-lg w-full max-w-xl ">

                                {/* TOP BAR */}
                                <div className="flex items-center gap-4">

                                    <button
                                        onClick={recording ? stopRecording : startRecording}
                                        className={`px-6 py-2 bg-[#4aa3bf] rounded text-white font-semibold
            
          `}
                                    >
                                        {recording ? "Stop" : "Start"}
                                    </button>

                                    {/* PLAYBACK */}
                                    {audioURL && (
                                        <div className="">


                                            {/* hidden audio */}
                                            <audio ref={audioRef} src={audioURL} />

                                            <button
                                                onClick={() => audioRef.current.play()}
                                                className="px-4 py-2 bg-[#4aa3bf] text-white rounded "
                                            >
                                                Playback
                                            </button>
                                        </div>
                                    )}

                                    {/* RECORD ICON */}
                                    <div className="w-10 h-10 rounded-full border-4 border-red-500 flex items-center justify-center">
                                        <div
                                            className={`w-4 h-4 rounded-full bg-red-500 ${recording ? "animate-pulse" : ""
                                                }`}
                                        />
                                    </div>

                                    {/* TIMER */}
                                    <div className="text-gray-600 font-mono">
                                        00:{time.toString().padStart(2, "0")}
                                    </div>

                                    <span className="text-gray-400">Recording</span>

                                </div>

                            </div>
                            <div className="p-4 rounded-lg">

                                <p>- During the test, you will not have Record/Playback/Stop buttons. </p>
                                <p>- Voice recording will start automatically.</p>
                            </div>
                        </div>


                        <div className='w-xl'>
                            <img src="/images/logo/mic-test.png" alt="" />
                        </div>



                    </div>

                ),
            },
            {
                
                content: (
                    <div className="flex  items-center">
                        {/* TOP BLUE BAR */}
      <div className="h-14 bg-[#0b7fa5]" />

      {/* CONTENT */}
      <div className="flex-1  text-gray-800">

        <h2 className="text-lg font-semibold mb-4">Test Instructions</h2>

        <p className="mb-4">
          This test will measure the English Reading, Writing, Listening and
          Speaking skills that you need in an academic setting.
        </p>

        <ul className="list-disc pl-6 space-y-2 mb-6 text-sm">
          <li>
            The test is divided into 3 parts. Each part may contain a number of
            sections. The sections are individually timed.
          </li>
          <li>
            The timer will be shown in the top right corner of your screen. The
            number of items in the section will also be displayed.
          </li>
        </ul>

        {/* TIMER BOX */}
        <div className="bg-[#e6e2df] rounded-md p-6 w-[420px] mb-6">
          <div className="flex items-center gap-3 text-3xl font-semibold">
            <span>⏱</span>
            <span>Time Remaining</span>
            <span className="ml-auto">34:43</span>
          </div>

          <div className="flex items-center justify-center gap-3 mt-4 text-xl text-gray-700">
            <span className="text-2xl">≡</span>
            <span>1 of 5</span>
          </div>
        </div>

        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>
            At the beginning of each part you will receive instructions. These
            will provide details on what to expect in that part of the test.
          </li>
          <li>
            By clicking on the Next button at the bottom of each screen you
            confirm your answer and move to the next question.
          </li>
          <li>
            If you click on Next you will not be able to return to the previous
            question. You will not be able to revisit any questions at the end
            of the test.
          </li>
          <li>
            You will be offered a break of up to 10 minutes after Part 2. The
            break is optional.
          </li>
          <li>
            This test makes use of different varieties of English, for example,
            British, American, Australian. You can answer in the standard
            English variety of your choice.
          </li>
        </ul>
      </div>
                    </div>
                ),
            },
            {
                title: "Tips",
                content: (
                    <div className="  items-center">
                       
                        <p>the key lies in clear and natural expression, pronunciation, and correct grammer.</p>
                        <p>Avoid long pauses or using words like "um" or "uh".</p>
                        <p>fluency is crucial , don't hesitate just speak up directly.</p>
                    </div>
                ),
            },
            {
                title: "Personal Introduction",
                content: (
                    <div className="min-h-screen bg-white flex px-10 py-8">

      {/* LEFT CONTENT */}
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

      {/* RIGHT TIMER */}
      {/* <div className="w-80 flex items-center justify-center">
        {phase === "prep" && (
          <div className="flex items-center gap-4 text-gray-600">
            <div className="w-20 h-20 rounded-full border-4 border-gray-400 flex items-center justify-center text-xl font-semibold">
              {prepTimeLeft}
            </div>
            <span>Recording in {prepTimeLeft} seconds</span>
          </div>
        )}

        {phase === "recording" && (
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center text-xl font-semibold animate-pulse">
              {recordTimeLeft}
            </div>
            <span>Recording...</span>
          </div>
        )}

        {phase === "done" && (
          <div className="text-green-600 font-semibold">
            ✔ Recording Complete
          </div>
        )}
      </div> */}
    </div>

                ),
            },
            {
                title: "Start the Exam",
                content: (
                    <div className="flex flex-col lg:flex-row gap-8 items-center">
                          {/* ===== Top Blue Bar ===== */}
      <div className="h-10 bg-[#0c7a8a]" />

      {/* ===== Main Content ===== */}
      <div className="flex-1 relative px-8 ">
        
        {/* Instruction Text */}
        <p className="text-gray-800 text-base mb-8">
          Click <span className="font-semibold">"Next"</span> and we'll start the exam.
        </p>

        {/* Illustration Section */}
        <div className="absolute left-8 top-15">
          <img
            src="/images/logo/start-img.jpg" 
            alt="Instruction"
            className="w-[400px] select-none pointer-events-none"
          />
        </div>
      </div>
                    </div>
                ),
            },
        ];

        const maxPage = introPages.length;
        const page = Math.min(introPage, maxPage);
        const isLast = page === maxPage;
        const current = introPages[page - 1];

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
                                {page > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        onClick={() => setIntroPage((p) => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl border-2 border-blue-600 dark:border-blue-500 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:text-white"
                                    onClick={() => {
                                        if (isLast) {
                                            setCurrentScreen("section_instructions");
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
            </div>
        );
    }
);