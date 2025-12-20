import React, { useEffect, useState, useCallback } from "react";
import {
    Calculator as CalculatorIcon,
    LogOut,
    Clock,
    Eye
} from "lucide-react";

export type GRETestHeaderProps = {
    testTitle?: string;
    currentSection?: { name?: string; durationMinutes?: number };
    currentQuestion?: any;
    activeSectionIndex: number;
    totalSections: number;
    timerSecondsLeft: number;
    currentScreen: "intro" | "test" | "results" | string;
    isCompleted: boolean;
    savingProgress?: boolean;
    saveCurrentQuestionProgress?: () => void;
    navigateBack?: () => void;
    onThemeToggle?: () => void;
    theme?: "light" | "dark";
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
        navigateBack
    }) => {
        const [timerHidden, setTimerHidden] = useState(false);
        const [timeWarning, setTimeWarning] = useState(false);
        const questionNumber = currentQuestion.order

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

        const handleSaveProgress = () => {
            setOpenMore(false);
            if (saveCurrentQuestionProgress && !isCompleted && !savingProgress) {
                saveCurrentQuestionProgress();
            }
        };

        return (
            <>
                <div
                    className="fixed top-0 left-0 right-0 z-50 bg-gray-400 dark:bg-slate-900/50 backdrop-blur"
                >
                    <div className="mx-auto grid grid-cols-2 items-center max-w-7xl h-16 items-center justify-between gap-4 px-4 py-1">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="uppercase">{testTitle}</p>
                                <p className="text-xs capitalize text-slate-800 dark:text-slate-200">
                                    Section {activeSectionIndex + 1} : {currentSection?.name || "Section"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <div className="">
                                {currentSection?.durationMinutes && currentScreen !== "intro" && !timerHidden ? (
                                    <div className="flex flex-col items-end rounded-full px-3 py-1">
                                        <div className="flex items-center">
                                        <Clock className="w-5 h-5 mr-1 text-slate-800 font-bold dark:text-slate-400" /><span className="tabular-nums">Time Remaining: {formatTime(timerSecondsLeft)}</span>
                                        </div>
                                       <div>
                                        Question {questionNumber} of {currentSection?.questions?.length}
                                        </div> 
                                        {/* <button
                                            onClick={() => setTimerHidden(true)}
                                            className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            aria-label="Hide timer"
                                        >
                                            <EyeOff className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                        </button> */}
                                    </div>
                                ) : currentSection?.durationMinutes && currentScreen !== "intro" ? (
                                    <button
                                        onClick={() => setTimerHidden(false)}
                                        className="flex items-center flex-col gap-2 rounded-lg transition-colors group"
                                    >
                                        <div className="relative">
                                            <Clock className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                    </button>
                                ) : null}
                            </div>

                            {(currentScreen === "results" || isCompleted) && navigateBack && (
                                <button
                                    onClick={navigateBack}
                                    className="ml-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-all shadow hover:shadow-lg"
                                >
                                    <span className="flex items-center gap-2">
                                        <LogOut className="w-4 h-4" />
                                        Exit Test
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div >
            </>
        );
    }
);