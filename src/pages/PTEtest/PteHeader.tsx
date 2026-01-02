import React, { useEffect, useState, useCallback } from "react";
import {
    Calculator as CalculatorIcon,
    LogOut,
    Clock,
    Eye,
    AlertCircle,
    ChevronLeft,
    BookOpen,
    SkipForward
} from "lucide-react";

export type GRETestHeaderProps = {
    testTitle?: string;
    currentSection?: { 
        name?: string; 
        durationMinutes?: number;
        questions?: any[];
    };
    currentQuestion?: any;
    activeSectionIndex: number;
    totalSections: number;
    timerSecondsLeft: number;
    currentScreen: "instructions" | "intro" | "test" | "question" | "section_review" | "results" | string;
    isCompleted: boolean;
    savingProgress?: boolean;
    saveCurrentQuestionProgress?: () => void;
    navigateBack?: () => void;
    onThemeToggle?: () => void;
    theme?: "light" | "dark";
    onTimeUp?: () => void;
    currentInstructionStep?: number;
    totalInstructionSteps?: number;
    onSkipInstructions?: () => void;
};

export const GRETestHead: React.FC<GRETestHeaderProps> = React.memo(
    ({
        testTitle,
        currentSection,
        currentQuestion,
        activeSectionIndex,
        totalSections,
        timerSecondsLeft,
        currentScreen,
        isCompleted,
        savingProgress,
        saveCurrentQuestionProgress,
        navigateBack,
        currentInstructionStep = 0,
        totalInstructionSteps = 0,
        onSkipInstructions,
    }) => {
        const [timerHidden, setTimerHidden] = useState(false);
        const [timeWarning, setTimeWarning] = useState(false);
        const questionNumber = currentQuestion?.order || 0;

        const formatTime = useCallback((seconds: number) => {
            if (seconds < 0) seconds = 0;
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }, []);

        // Time warning effect
        useEffect(() => {
            if (timerSecondsLeft <= 300 && timerSecondsLeft > 0) {
                setTimeWarning(true);
            } else {
                setTimeWarning(false);
            }
        }, [timerSecondsLeft]);

        const timeUpRef = React.useRef(false);

        // section change hone par reset
        useEffect(() => {
            timeUpRef.current = false;
        }, [currentSection]);

        const handleSaveProgress = () => {
            if (saveCurrentQuestionProgress && !isCompleted && !savingProgress) {
                saveCurrentQuestionProgress();
            }
        };

        // Instructions screen में अलग UI
        if (currentScreen === "instructions") {
            return (
                <>
                    <div className="fixed top-0 left-0 right-0 z-50 bg-[#bfbbbc] backdrop-blur">
                        <div className="mx-auto grid grid-cols-3 items-center max-w-7xl h-15 px-4 py-2">
                            {/* Left: Back button */}
                            <div className="flex items-center">
                                <button
                                    onClick={navigateBack}
                                    className="flex items-center gap-2 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="hidden sm:inline">Exit Test</span>
                                </button>
                            </div>

                            {/* Center: Progress indicator */}
                            <div className="text-center">
                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    Step {currentInstructionStep + 1} of {totalInstructionSteps || 4}
                                </div>
                                <div className="mt-1 h-1.5 w-full max-w-xs mx-auto bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ 
                                            width: `${((currentInstructionStep + 1) / (totalInstructionSteps || 4)) * 100}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Right: Skip button */}
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={onSkipInstructions}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <SkipForward className="w-4 h-4" />
                                    <span className="text-sm">Skip Instructions</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        // Normal test screen UI
        return (
            <>
                <div className="fixed top-0 left-0 right-0 z-50 bg-[#bfbbbc] backdrop-blur">
                    <div className="mx-auto grid grid-cols-2 items-center max-w-7xl h-15 items-center justify-between gap-4 px-4">
                        {/* Left: Test info */}
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="uppercase font-medium text-slate-800 dark:text-slate-200">
                                    {testTitle || "PTE Mock Test"}
                                </p>
                                <p className="text-xs capitalize text-slate-800 dark:text-slate-200">
                                    {currentScreen === "question" ? (
                                        <>Section {activeSectionIndex + 1} : {currentSection?.name || "Section"}</>
                                    ) : currentScreen === "section_review" ? (
                                        "Section Review"
                                    ) : currentScreen === "results" ? (
                                        "Test Results"
                                    ) : (
                                        `Section ${activeSectionIndex + 1} of ${totalSections}`
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Right: Timer and navigation */}
                        <div className="flex items-center justify-end gap-3">
                            <div className="">
                                {currentSection?.durationMinutes && 
                                 currentScreen === "question" && 
                                 !timerHidden && 
                                 timerSecondsLeft > 0 ? (
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center  rounded-lg">
                                            <Clock className="w-5 h-5 mr-1.5 text-slate-800 font-bold dark:text-slate-400" />
                                            <span className={`tabular-nums font-medium ${timeWarning ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-300'}`}>
                                                {formatTime(timerSecondsLeft)}
                                            </span>
                                        </div>
                                        <div className="flex items-center ml-3">
                                            <AlertCircle className="w-4 h-4 mr-1.5 text-slate-800 dark:text-slate-400"/>
                                            <span className="text-sm text-slate-800 dark:text-slate-300">
                                                Q{questionNumber} of {currentSection?.questions?.length}
                                            </span>
                                        </div>
                                    </div>
                                ) : currentScreen === "question" && currentSection?.durationMinutes ? (
                                    <button
                                        onClick={() => setTimerHidden(false)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                        <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                        <span className="text-sm">Show Timer</span>
                                    </button>
                                ) : null}
                            </div>

                         
                        </div>
                    </div>

                    {/* Time warning bar */}
                    {timeWarning && currentScreen === "question" && !timerHidden && (
                        <div className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-1 text-sm font-medium animate-pulse">
                            ⚠️ Less than 5 minutes remaining in this section!
                        </div>
                    )}
                </div >
            </>
        );
    }
);