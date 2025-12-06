import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
    Calculator as CalculatorIcon,
    LogOut,
    HelpCircle,
    MessageSquare,
    Settings,
    Moon,
    ChevronDown,
    ChevronUp,
    Watch,
    Clock,
    Save,
    MoreVertical,
    UserX2,
    Minus,
    Maximize2,
    Minimize2,
    X,
    Brain,
    Hash,
    Grid3X3,
    Type,
    Volume2,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
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

// Custom hooks remain the same
function useClickOutside<T extends HTMLElement>(
    ref: React.RefObject<T>,
    handler: () => void
) {
    useEffect(() => {
        const listener = (e: MouseEvent | TouchEvent) => {
            if (!ref.current) return;
            if (e.target instanceof Node && !ref.current.contains(e.target)) handler();
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}

// Animation imports
import { motion, AnimatePresence } from "framer-motion"

/* ---------------- Popover (Directions / Reference) ---------------- */
const Popover: React.FC<{
    anchorRef: React.RefObject<HTMLElement>;
    open: boolean;
    onClose: () => void;
    width?: number | string;
    maxHeight?: number | string;
    title?: string;
    children?: React.ReactNode;
}> = ({ anchorRef, open, onClose, width = 720, maxHeight = "60vh", title, children }) => {
    const ref = useRef<any | null>(null);
    useClickOutside(ref, onClose);

    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
    useEffect(() => {
        if (!open || !anchorRef.current) {
            setPos(null);
            return;
        }
        const rect = anchorRef.current.getBoundingClientRect();
        const w = typeof width === "number" ? width : 720;
        const left = Math.min(
            window.innerWidth - w - 12,
            rect.left + rect.width / 2 - w / 2
        );
        const top = rect.bottom + 12;
        setPos({ left: Math.max(12, left), top: Math.max(12, top) });
    }, [open, anchorRef, width]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && pos && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    ref={ref}
                    style={{
                        position: "fixed",
                        left: pos.left,
                        top: pos.top,
                        width,
                        maxHeight,
                        zIndex: 9999,
                    }}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    role="dialog"
                    aria-modal="false"
                    aria-label={title || "Popover"}
                >
                    {/* Arrow */}
                    <div
                        style={{ position: "absolute", left: 24, top: -12 }}
                        className="w-0 h-0"
                    >
                        <svg
                            width="24"
                            height="12"
                            viewBox="0 0 24 12"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 0 L24 12 L0 12 Z"
                                className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
                            />
                        </svg>
                    </div>

                    <div
                        className="p-6 dark:text-slate-200"
                        style={{ maxHeight, overflow: "auto" }}
                    >
                        {title && (
                            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                                {title}
                            </h3>
                        )}
                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {children}
                        </div>

                        <div className="flex justify-end mt-6">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all"
                            >
                                Close
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
const NavDropdown: React.FC<{
    anchorRef: React.RefObject<HTMLElement>;
    open: boolean;
    onClose: () => void;
    children?: React.ReactNode;
    width?: number;
}> = ({ anchorRef, open, onClose, children, width = 260 }) => {
    const ref = useRef<any | null>(null);
    useClickOutside(ref, onClose);

    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
    useEffect(() => {
        if (!open || !anchorRef.current) {
            setPos(null);
            return;
        }
        const rect = anchorRef.current.getBoundingClientRect();
        const left = Math.min(window.innerWidth - width - 12, rect.left);
        const top = rect.bottom + 8;
        setPos({ left: Math.max(12, left), top });
    }, [open, anchorRef, width]);

    useEffect(() => {
        if (!open || !ref.current) return;
        const focusable = Array.from(
            ref.current.querySelectorAll<HTMLElement>(
                "button[role='menuitem']:not(:disabled), a[role='menuitem']"
            )
        );
        if (focusable.length) focusable[0].focus();
        let idx = 0;
        const onKey = (e: KeyboardEvent) => {
            if (!ref.current) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                idx = Math.min(focusable.length - 1, idx + 1);
                focusable[idx]?.focus();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                idx = Math.max(0, idx - 1);
                focusable[idx]?.focus();
            } else if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && pos && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    ref={ref}
                    style={{
                        position: "fixed",
                        left: pos.left,
                        top: pos.top,
                        width,
                        zIndex: 9999,
                    }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden backdrop-blur-sm bg-opacity-95"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 -z-10" />
                    <div className="py-2">{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


type CalculatorWindowProps = {
    open: boolean;
    onClose: () => void;
    initialX?: number;
    initialY?: number;
};

export const CalculatorWindow: React.FC<CalculatorWindowProps> = ({
    open,
    onClose,
    initialX = 80,
    initialY = 120,
}) => {
    const windowRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const desmosRef = useRef<HTMLDivElement | null>(null);
    const calculatorRef = useRef<any>(null); // Desmos calculator instance

    const [pos, setPos] = useState({ x: initialX, y: initialY });
    const dragStart = useRef<{ mouseX: number; mouseY: number; x: number; y: number } | null>(null);
    const [dragging, setDragging] = useState(false);

    const [minimized, setMinimized] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [mode, setMode] = useState<"scientific" | "graphing">("scientific");

    const savedStateRef = useRef<any | null>(null);

    useEffect(() => {
        if (!open) return;

        const existing = document.querySelector<HTMLScriptElement>('script[data-desmos-api="1.11"]');
        if (!existing) {
            const script = document.createElement("script");
            script.src = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=a13a0bfaa4494af1976eee2b9e5af053";
            script.async = true;
            script.setAttribute("data-desmos-api", "1.11");
            document.head.appendChild(script);

            const onLoad = () => {
                createDesmosCalculator();
            };
            script.addEventListener("load", onLoad);
            return () => {
                script.removeEventListener("load", onLoad);
            };
        } else {
            if ((window as any).Desmos) createDesmosCalculator();
        }

    }, [open, mode]);

    useEffect(() => {
        return () => {
            destroyCalculator();
        };
    }, []);

    // create or recreate the Desmos calculator instance depending on mode
    const createDesmosCalculator = () => {
        if (!open || !desmosRef.current) return;
        const D = (window as any).Desmos;
        if (!D) return;

        destroyCalculator();

        try {
            if (mode === "graphing") {
                calculatorRef.current = D.GraphingCalculator(desmosRef.current, {
                    keypad: true,
                    expressions: true,
                    settingsMenu: true,
                    zoomButtons: true,
                    expressionsTopbar: true,
                    border: false,
                    autosize: true,
                });
            } else {
                calculatorRef.current = D.ScientificCalculator(desmosRef.current, {
                    keypad: true,
                    qwertyKeyboard: true,
                    degreeMode: false, // default radians; toggle via settings if needed
                    fontSize: 16,
                    settingsMenu: true,
                    autosize: true,
                });
            }

            // If we have a saved state previously, restore it
            if (savedStateRef.current && typeof calculatorRef.current.setState === "function") {
                try {
                    calculatorRef.current.setState(savedStateRef.current, { allowUndo: false });
                } catch (err) {
                    console.warn("Failed to restore Desmos state:", err);
                }
            }

            if (calculatorRef.current && typeof calculatorRef.current.observeEvent === "function") {
                calculatorRef.current.observeEvent("change", () => {
                    try {
                        if (typeof calculatorRef.current.getState === "function") {
                            savedStateRef.current = calculatorRef.current.getState();
                        }
                    } catch (err) {
                    }
                });
            }
        } catch (err) {
            console.error("Failed to create Desmos calculator:", err);
        }
    };

    const destroyCalculator = () => {
        try {
            if (calculatorRef.current) {
                try {
                    if (typeof calculatorRef.current.getState === "function") {
                        savedStateRef.current = calculatorRef.current.getState();
                    }
                } catch (e) {
                }
                if (typeof calculatorRef.current.destroy === "function") {
                    calculatorRef.current.destroy();
                }
                calculatorRef.current = null;
            }
        } catch (err) {
            console.warn("Error destroying Desmos calculator:", err);
        }
    };

    // Watch mode toggles: recreate calculator to switch UI
    useEffect(() => {
        if (!open) return;
        const t = window.setTimeout(() => {
            createDesmosCalculator();
        }, 10);
        return () => clearTimeout(t);
    }, [mode, open]);

    // drag handling
    useEffect(() => {
        function onMove(e: MouseEvent) {
            if (!dragging || !dragStart.current) return;
            const dx = e.clientX - dragStart.current.mouseX;
            const dy = e.clientY - dragStart.current.mouseY;
            setPos({ x: dragStart.current.x + dx, y: dragStart.current.y + dy });
        }
        function onUp() {
            setDragging(false);
            dragStart.current = null;
        }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [dragging]);

    const onHeaderMouseDown = (e: React.MouseEvent) => {
        // don't start dragging when clicking a button in the header
        if ((e.target as HTMLElement).closest("button")) return;
        setDragging(true);
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, x: pos.x, y: pos.y };
        e.preventDefault();
    };

    // ESC closes
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Helpers: expose get/set/clear via UI buttons
    const handleGetState = () => {
        if (calculatorRef.current && typeof calculatorRef.current.getState === "function") {
            try {
                const state = calculatorRef.current.getState();
                // store in memory; you can send to server here
                savedStateRef.current = state;
                // also show a quick visual
                alert("State captured (stored in-memory). Use set-state to restore it.");
            } catch (err) {
                console.error(err);
                alert("Failed to get state");
            }
        } else {
            alert("Calculator not ready or does not support getState.");
        }
    };

    const handleSetState = () => {
        if (!savedStateRef.current) {
            alert("No saved state in memory.");
            return;
        }
        if (calculatorRef.current && typeof calculatorRef.current.setState === "function") {
            try {
                calculatorRef.current.setState(savedStateRef.current, { allowUndo: false });
                alert("State restored.");
            } catch (err) {
                console.error(err);
                alert("Failed to set state (maybe incompatible).");
            }
        } else {
            alert("Calculator not ready or does not support setState.");
        }
    };

    const handleClear = () => {
        if (calculatorRef.current && typeof calculatorRef.current.setBlank === "function") {
            try {
                calculatorRef.current.setBlank();
                savedStateRef.current = null;
            } catch (err) {
                console.warn(err);
            }
        } else {
            alert("Calculator not ready or does not support clearing.");
        }
    };

    useEffect(() => {
        if (!open) {
            destroyCalculator();
        } else {
            const maybeCreate = () => {
                if ((window as any).Desmos) createDesmosCalculator();
            };
            maybeCreate();
        }
    }, [open]);

    if (!open) return null;

    const width = maximized ? "100vw" : minimized ? 220 : mode === "graphing" ? 600 : 420;
    const height = maximized ? "100vh" : minimized ? 40 : mode === "graphing" ? 560 : 520;

    return (
        <div
            ref={windowRef}
            className="fixed z-50 rounded-lg shadow-2xl bg-white overflow-hidden"
            style={{
                left: maximized ? 0 : pos.x,
                top: maximized ? 0 : pos.y,
                width,
                height,
            }}
            role="dialog"
            aria-label="Calculator"
        >
            {/* Header */}
            <div
                ref={headerRef}
                onMouseDown={onHeaderMouseDown}
                className="flex items-center justify-between cursor-move px-3 py-2 bg-gray-500 text-white select-none"
            >
                <div className="flex items-center gap-3">
                    <CalculatorIcon className="h-6 w-6" />

                    {!minimized && <div className="ml-1 flex items-center gap-2">
                        <button
                            onClick={() => setMode("scientific")}
                            className={`px-2 py-1 rounded-full text-xs ${mode === "scientific" ? "bg-white text-blue-600" : "bg-white/20"}`}
                        >
                            Scientific
                        </button>
                        <button
                            onClick={() => setMode("graphing")}
                            className={`px-2 py-1 rounded-full text-xs ${mode === "graphing" ? "bg-white text-blue-600" : "bg-white/20"}`}
                        >
                            Graphing
                        </button>
                    </div>}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setMinimized((s) => !s);
                        }}
                        className="px-2 py-1 rounded hover:bg-white/20"
                        title={minimized ? "Restore" : "Minimize"}
                        aria-label={minimized ? "Restore" : "Minimize"}
                    >
                        {minimized ? "" : "—"}
                    </button>

                    <button
                        onClick={() => {
                            if (minimized) {
                                setMinimized(false);
                            } else {
                                setMaximized((s) => !s);
                            }
                        }}
                        className="px-2 py-1 rounded hover:bg-white/20"
                        title={maximized ? "Restore" : "Maximize"}
                        aria-label={maximized ? "Restore" : "Maximize"}
                    >
                        {maximized ? "🗗" : "🗖"}
                    </button>

                    <button
                        onClick={() => {
                            onClose();
                        }}
                        className="px-2 py-1 rounded hover:bg-white/20"
                        title="Close"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>
            {!minimized && (
                <div style={{ height: `calc(100% - 60px)` }} className="bg-white">
                    <div className="flex items-stretch h-full">
                        <div ref={desmosRef} style={{ flex: 1, minWidth: 0 }} className="bg-white" />
                    </div>
                </div>
            )}
        </div>
    );
};


const Modal: React.FC<{
    open: boolean;
    title?: string;
    onClose: () => void;
    children?: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
}> = ({ open, title, onClose, children, size = "md" }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    useClickOutside(ref, onClose);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !ref.current) return;
        const focusable = ref.current.querySelector<HTMLElement>(
            "button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])"
        );
        focusable?.focus();
    }, [open]);

    if (!open) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        ref={ref}
                        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden border border-slate-200 dark:border-slate-700`}
                        >
                            {title && (
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                        {title}
                                    </h3>
                                </div>
                            )}
                            <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

/* ---------------- Main Header Component ---------------- */
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
        onThemeToggle,
        theme = "light",
    }) => {
        const [timerHidden, setTimerHidden] = useState(false);
        const [timeWarning, setTimeWarning] = useState(false);

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

        // State for popovers and modals
        const directionsRef = useRef<HTMLButtonElement | null>(null);
        const referenceRef = useRef<HTMLButtonElement | null>(null);
        const moreRef = useRef<HTMLButtonElement | null>(null);

        const [openDirections, setOpenDirections] = useState(false);
        const [openReference, setOpenReference] = useState(false);
        const [openCalculator, setOpenCalculator] = useState(false);
        const [openMore, setOpenMore] = useState(false);

        // Modal states
        const [helpOpen, setHelpOpen] = useState(false);
        const [complainOpen, setComplainOpen] = useState(false);
        const [settingsOpen, setSettingsOpen] = useState(false);

        // Settings state
        const [settings, setSettings] = useState({
            autoSave: true,
            reduceAnimations: false,
            soundOnCompletion: true,
            fontSize: "medium" as "small" | "medium" | "large",
        });

        // Close all on ESC
        useEffect(() => {
            const onKey = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    setOpenDirections(false);
                    setOpenReference(false);
                    setOpenCalculator(false);
                    setOpenMore(false);
                }
            };
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
        }, []);

        // Sample content
        const directionsContent = useMemo(
            () => (
                <>
                    <p className="mb-4">
                        The questions in this section address a number of important reading and writing skills. Each question includes one
                        or more passages, which may include a table or graph. Read each passage and question carefully, and then choose
                        the best answer to the question based on the passage(s).
                    </p>
                    <p className="mb-4">
                        All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 my-4">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Important:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>You can skip questions and return to them later</li>
                            <li>Use the "Mark for Review" feature to flag questions</li>
                            <li>The calculator is available for quantitative sections</li>
                        </ul>
                    </div>
                </>
            ),
            []
        );

        const referenceContent = useMemo(
            () => (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Math Formulas
                            </h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <Hash className="w-4 h-4" /> Area of circle: πr²
                                </li>
                                <li className="flex items-center gap-2">
                                    <Hash className="w-4 h-4" /> Quadratic formula: x = [-b ± √(b²-4ac)]/2a
                                </li>
                                <li className="flex items-center gap-2">
                                    <Hash className="w-4 h-4" /> Pythagorean: a² + b² = c²
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Quick Reference
                            </h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <Type className="w-4 h-4" /> Common prefixes/suffixes
                                </li>
                                <li className="flex items-center gap-2">
                                    <Grid3X3 className="w-4 h-4" /> Coordinate geometry rules
                                </li>
                                <li className="flex items-center gap-2">
                                    <Brain className="w-4 h-4" /> Logical fallacies
                                </li>
                            </ul>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                        Tip: You can copy these references to your notes panel for quick access.
                    </p>
                </>
            ),
            []
        );

        // Dropdown action handlers
        const handleHelp = () => {
            setOpenMore(false);
            setHelpOpen(true);
        };

        const handleComplain = () => {
            setOpenMore(false);
            setComplainOpen(true);
        };

        const handleSettings = () => {
            setOpenMore(false);
            setSettingsOpen(true);
        };

        const handleThemeToggle = () => {
            setOpenMore(false);
            onThemeToggle?.();
        };

        const handleSaveProgress = () => {
            setOpenMore(false);
            if (saveCurrentQuestionProgress && !isCompleted && !savingProgress) {
                saveCurrentQuestionProgress();
            }
        };

        return (
            <>
                <div
                    style={{ borderBottomWidth: "3px" }}
                    className="fixed top-0 left-0 right-0 z-50 border-dashed border-gray-800 dark:border-slate-700 bg-gray-200 dark:bg-slate-900/95 backdrop-blur"
                >
                    <div className="mx-auto grid grid-cols-3 items-center max-w-7xl h-16 items-center justify-between gap-4 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-lg capitalize text-slate-800 dark:text-slate-200">
                                    Section {activeSectionIndex + 1} : {currentSection?.name || "Section"}
                                </p>
                                <button
                                    ref={directionsRef}
                                    onClick={() => {
                                        setOpenDirections(!openDirections);
                                        // setOpenReference(!openReference);
                                        // setOpenMore(false);
                                    }}
                                    className="text-sm text-slate-700 dark:text-slate-400 inline-flex items-center gap-2"
                                >
                                    <span className="font-medium">Directions</span>
                                    {openDirections ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Center timer */}
                        <div className="flex-1 flex justify-center">
                            {currentSection?.durationMinutes && currentScreen !== "intro" && !timerHidden ? (
                                <div className="flex flex-col items-center rounded-full px-3 py-1">
                                    <span className="text-lg tabular-nums">{formatTime(timerSecondsLeft)}</span>
                                    <button
                                        onClick={() => setTimerHidden(true)}
                                        className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        aria-label="Hide timer"
                                    >
                                        <EyeOff className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </button>
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

                        <div className="flex items-center justify-end gap-3">
                            {currentSection?.name?.toLowerCase()?.includes("math") && <button
                                className="flex flex-col items-center p-2 colors group relative"
                                onClick={() => {
                                    setOpenCalculator(!openCalculator);
                                    setOpenDirections(false);
                                    setOpenReference(false);
                                    setOpenMore(false);
                                }}
                                aria-label="Open calculator"
                            >
                                <CalculatorIcon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                <span className="text-xs mt-1 font-medium text-slate-700 dark:text-slate-300">
                                    Calculator
                                </span>
                            </button>}

                            <button
                                ref={referenceRef}
                                className="flex flex-col items-center p-2 group relative"
                                onClick={() => {
                                    setOpenReference(!openReference);
                                    setOpenDirections(false);
                                    setOpenMore(false);
                                }}
                                aria-label="Reference materials"
                            >
                                <UserX2 className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                                <span className="text-xs mt-1 font-medium text-slate-700 dark:text-slate-300">
                                    Reference
                                </span>
                            </button>

                            <div className="relative">
                                <button
                                    ref={moreRef}
                                    className="flex flex-col items-center p-2 group"
                                    onClick={() => {
                                        setOpenMore(!openMore);
                                        setOpenDirections(false);
                                        setOpenReference(false);
                                    }}
                                    aria-haspopup="true"
                                    aria-expanded={openMore}
                                >
                                    <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
                                    <span className="text-xs mt-1 font-medium text-slate-700 dark:text-slate-300">
                                        More
                                    </span>
                                </button>
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

                < Popover
                    anchorRef={directionsRef}
                    open={openDirections}
                    onClose={() => setOpenDirections(false)}
                    width={500}
                    maxHeight="70vh"
                    title="Section Directions & Guidelines"
                >
                    {directionsContent}
                </Popover >

                <Popover
                    anchorRef={referenceRef}
                    open={openReference}
                    onClose={() => setOpenReference(false)}
                    width={520}
                    maxHeight="50vh"
                    title="Quick Reference Materials"
                >
                    {referenceContent}
                </Popover>

                <CalculatorWindow open={openCalculator} onClose={() => setOpenCalculator(false)} />

                <NavDropdown anchorRef={moreRef} open={openMore} onClose={() => setOpenMore(false)} width={280}>
                    <div className="py-2">
                        <button
                            onClick={handleSaveProgress}
                            disabled={!!isCompleted || !!savingProgress}
                            role="menuitem"
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-all ${isCompleted || savingProgress
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                                }`}
                        >
                            <Save className={`w-4 h-4 ${savingProgress ? "animate-pulse" : ""}`} />
                            <div className="flex-1">
                                <span className="font-medium">Save Progress</span>
                                {savingProgress && (
                                    <span className="text-xs text-slate-500 ml-2">Saving...</span>
                                )}
                            </div>
                            <kbd className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                Ctrl+S
                            </kbd>
                        </button>

                        <button
                            onClick={handleHelp}
                            role="menuitem"
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <div>
                                <span className="font-medium">Help & Support</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Get assistance during test
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={handleComplain}
                            role="menuitem"
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            <AlertCircle className="w-4 h-4" />
                            <div>
                                <span className="font-medium">Report Issue</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Technical problems or concerns
                                </p>
                            </div>
                        </button>

                        {/* <button
                            onClick={handleSettings}
                            role="menuitem"
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            <Settings className="w-4 h-4" />
                            <div>
                                <span className="font-medium">Settings</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Customize your test experience
                                </p>
                            </div>
                        </button> */}

                        <button
                            onClick={handleThemeToggle}
                            role="menuitem"
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            <Moon className="w-4 h-4" />
                            <div className="flex-1">
                                <span className="font-medium">Toggle Theme</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Switch to {theme === "light" ? "dark" : "light"} mode
                                </p>
                            </div>
                            <div className={`w-10 h-6 rounded-full p-1 ${theme === "dark" ? "bg-blue-500" : "bg-slate-300"}`}>
                                <div
                                    className={`w-4 h-4 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-4" : ""}`}
                                />
                            </div>
                        </button>
                    </div>
                </NavDropdown>

                {/* Help Modal */}
                <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & Support" size="lg">
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                Need assistance during the test?
                            </h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                Our support team is available 24/7 to help with any technical issues or questions about the test format.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h5 className="font-semibold mb-3 text-slate-800 dark:text-slate-200">
                                    Contact Support
                                </h5>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <span className="font-medium">Email:</span>
                                        support@greprep.com
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="font-medium">Phone:</span>
                                        +1 (800) 123-4567
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="font-medium">Live Chat:</span>
                                        Available 24/7
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-semibold mb-3 text-slate-800 dark:text-slate-200">
                                    Quick Resources
                                </h5>
                                <ul className="space-y-2 text-sm">
                                    <li className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                        Test-taking strategies
                                    </li>
                                    <li className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                        Technical requirements
                                    </li>
                                    <li className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                        Practice tests
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Complain Modal */}
                <Modal open={complainOpen} onClose={() => setComplainOpen(false)} title="Report an Issue" size="lg">
                    <div className="space-y-6">
                        <p className="text-slate-700 dark:text-slate-300">
                            Please describe the issue you're experiencing. Our team will review your report and get back to you within 24 hours.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                    Issue Type
                                </label>
                                <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800">
                                    <option>Technical problem</option>
                                    <option>Content error</option>
                                    <option>Timing issue</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    placeholder="Describe your issue in detail..."
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-4 min-h-[120px] bg-white dark:bg-slate-800"
                                    rows={4}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        Include screenshot (if available)
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => {
                                    alert("Report submitted. We'll contact you within 24 hours.");
                                    setComplainOpen(false);
                                }}
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-all shadow hover:shadow-lg"
                            >
                                Submit Report
                            </button>
                            <button
                                onClick={() => setComplainOpen(false)}
                                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Settings Modal */}
                <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Test Settings" size="md">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">Auto-save progress</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Automatically save your answers every 30 seconds</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, autoSave: !s.autoSave }))}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoSave ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.autoSave ? "translate-x-6" : ""}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">Reduce animations</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Minimize motion for better performance</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, reduceAnimations: !s.reduceAnimations }))}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.reduceAnimations ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.reduceAnimations ? "translate-x-6" : ""}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">Completion sound</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Play sound when section completes</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, soundOnCompletion: !s.soundOnCompletion }))}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.soundOnCompletion ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.soundOnCompletion ? "translate-x-6" : ""}`} />
                                </button>
                            </div>

                            <div className="py-3">
                                <p className="font-medium mb-3 text-slate-800 dark:text-slate-200">Text Size</p>
                                <div className="flex gap-2">
                                    {(["small", "medium", "large"] as const).map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSettings(s => ({ ...s, fontSize: size }))}
                                            className={`px-4 py-2 rounded-lg transition-all ${settings.fontSize === size
                                                ? "bg-blue-500 text-white"
                                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                }`}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-4">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                <strong>Note:</strong> Some settings may require a page refresh to take full effect.
                            </p>
                        </div>
                    </div>
                </Modal>
            </>
        );
    }
);