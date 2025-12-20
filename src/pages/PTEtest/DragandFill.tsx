import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/* ===================== TYPES ===================== */

interface PTEFillDragProps {
  questionText: string;
  listeningText: string;
  currentAnswer: string;
  isCompleted: boolean;
  onAnswerChange: (answer: string) => void;
}

interface DropZone {
  id: string;
  placeholder: string;
  number: number;
  position: number;
}

/* ===================== COMPONENT ===================== */

const PTEFillDrag: React.FC<PTEFillDragProps> = memo(
  ({ questionText, listeningText, currentAnswer, isCompleted, onAnswerChange }) => {
    /* ===================== STATE ===================== */

    const [filledAnswers, setFilledAnswers] = useState<Record<string, string>>(
      {}
    );
    const [draggedWord, setDraggedWord] = useState<string | null>(null);
    const [activeZone, setActiveZone] = useState<string | null>(null);

    const initializedRef = useRef(false);

    /* ===================== DERIVED DATA (NO STATE) ===================== */

    const dropZones: DropZone[] = useMemo(() => {
      if (!questionText) return [];

      const regex = /\{\{(\d+)\}\}/g;
      const zones: DropZone[] = [];
      let match;

      while ((match = regex.exec(questionText)) !== null) {
        zones.push({
          id: `zone-${match[1]}`,
          placeholder: `{{${match[1]}}}`,
          number: Number(match[1]),
          position: match.index,
        });
      }

      return zones.sort((a, b) => a.position - b.position);
    }, [questionText]);

    const availableWords = useMemo(() => {
      if (!listeningText) return [];
      return listeningText
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);
    }, [listeningText]);

    /* ===================== INIT ANSWER (ONCE) ===================== */

    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      if (currentAnswer) {
        try {
          const parsed = JSON.parse(currentAnswer);
          if (parsed && typeof parsed === "object") {
            setFilledAnswers(parsed);
          }
        } catch {
          setFilledAnswers({});
        }
      }
    }, []);

    /* ===================== UPDATE ANSWERS (SAFE) ===================== */

    const updateAnswers = useCallback(
      (updater: (prev: Record<string, string>) => Record<string, string>) => {
        setFilledAnswers((prev) => {
          const next = updater(prev);
          onAnswerChange(JSON.stringify(next));
          return next;
        });
      },
      [onAnswerChange]
    );

    /* ===================== DRAG HANDLERS ===================== */

    const handleDragStart = useCallback(
      (e: React.DragEvent, word: string) => {
        e.dataTransfer.setData("text/plain", word);
        setDraggedWord(word);
      },
      []
    );

    const handleDrop = useCallback(
      (e: React.DragEvent, zoneId: string) => {
        e.preventDefault();
        const word = e.dataTransfer.getData("text/plain");

        if (!word) return;

        updateAnswers((prev) => {
          const next = { ...prev };

          // remove word from previous zone
          const existing = Object.keys(next).find(
            (k) => next[k] === word
          );
          if (existing) delete next[existing];

          next[zoneId] = word;
          return next;
        });

        setDraggedWord(null);
        setActiveZone(null);
      },
      [updateAnswers]
    );

    const handleRemoveWord = useCallback(
      (zoneId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        updateAnswers((prev) => {
          const next = { ...prev };
          delete next[zoneId];
          return next;
        });
      },
      [updateAnswers]
    );

    const handleClearAll = useCallback(() => {
      updateAnswers(() => ({}));
    }, [updateAnswers]);


    const isWordUsed = useMemo(() => {
      const used = new Set(Object.values(filledAnswers));
      return (word: string) => used.has(word);
    }, [filledAnswers]);


    const renderedText = useMemo(() => {
      if (!questionText) return null;

      const regex = /\{\{(\d+)\}\}/g;
      const parts: React.ReactNode[] = [];

      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(questionText)) !== null) {
        const index = match.index;
        const number = match[1];
        const zoneId = `zone-${number}`;

        // HTML before blank
        const htmlBefore = questionText.slice(lastIndex, index);
        if (htmlBefore) {
          parts.push(
            <span
              key={`html-${index}`}
              dangerouslySetInnerHTML={{ __html: htmlBefore }}
            />
          );
        }

        const filledWord = filledAnswers[zoneId];
        const isActive = draggedWord && activeZone === zoneId;

        // Blank / Filled
        if (filledWord) {
          parts.push(
            <motion.span
              key={zoneId}
              className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900 border-2 border-green-400 rounded-lg px-3 py-0.5 mx-1"
            >
              <span className="font-medium">{filledWord}</span>
              {!isCompleted && (
                <button onClick={(e) => handleRemoveWord(zoneId, e)}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.span>
          );
        } else {
          parts.push(
            <span
              key={zoneId}
              onDragOver={(e) => {
                e.preventDefault();
                setActiveZone(zoneId);
              }}
              onDrop={(e) => handleDrop(e, zoneId)}
              className={`inline-flex min-w-[80px] h-7 mx-1 items-center justify-center border-b-2 transition-all ${isActive
                ? "border-blue-800 bg-blue-50 dark:bg-blue-900/50"
                : "border-dashed border-slate-800 dark:border-slate-500"
                }`}
            >
              {``}
            </span>
          );
        }

        lastIndex = index + match[0].length;
      }

      // Remaining HTML
      const remainingHTML = questionText.slice(lastIndex);
      if (remainingHTML) {
        parts.push(
          <span
            key="html-end"
            dangerouslySetInnerHTML={{ __html: remainingHTML }}
          />
        );
      }

      return parts;
    }, [
      questionText,
      filledAnswers,
      draggedWord,
      activeZone,
      isCompleted,
      handleDrop,
      handleRemoveWord,
    ]);


    /* ===================== UI ===================== */

    return (
      <div className="space-y-3">
        {/* QUESTION */}
        <div className="">
          <div className="">{renderedText}</div>
        </div>

        {/* WORD BANK */}
        <div className="border-2 rounded-xl p-4 bg-slate-50">
          {/* <div className="flex justify-between mb-4">
                        <h3 className="font-semibold">Words to use</h3>
                        {!isCompleted && Object.keys(filledAnswers).length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-sm text-red-600"
                            >
                                Clear All
                            </button>
                        )}
                    </div> */}

          <div className="flex flex-wrap gap-3">
            <AnimatePresence>
              {availableWords.map((word) => {
                const used = isWordUsed(word);
                return (
                  <motion.div
                    key={word}
                    draggable={!used && !isCompleted}
                    onDragStart={(e) =>
                      !used && handleDragStart(e, word)
                    }
                    onDragEnd={() => setDraggedWord(null)}
                    className={`px-4 py-1 border-2 rounded-lg font-medium ${used
                      ? "bg-slate-200 text-slate-400"
                      : "bg-white cursor-grab"
                      }`}
                  >
                    {word}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }
);

PTEFillDrag.displayName = "PTEFillDrag";
export default PTEFillDrag;



import {
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Trash2,
  Check,
  ArrowUpDown
} from 'lucide-react';

interface PTEReorderProps {
  items: string[];
  currentAnswer: string;
  isCompleted: boolean;
  onAnswerChange: (answer: string) => void;
}

interface DragPayload {
  from: 'left' | 'right';
  index: number;
  item: string;
}

export const PTEReorder: React.FC<PTEReorderProps> = memo(
  ({ items, currentAnswer, isCompleted, onAnswerChange }) => {
    const initializedRef = useRef(false);
    const dragItemRef = useRef<DragPayload | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [hoverZone, setHoverZone] = useState<'left' | 'right' | null>(null);

    const [left, setLeft] = useState<string[]>([]);
    const [right, setRight] = useState<string[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [selectedRight, setSelectedRight] = useState<number | null>(null);

    /* ================= INIT (ONCE PER QUESTION) ================= */
    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      if (currentAnswer) {
        try {
          const parsed = JSON.parse(currentAnswer);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRight(parsed);
            setLeft(items.filter((i) => !parsed.includes(i)));
            return;
          }
        } catch { }
      }
      setLeft(items);
    }, [currentAnswer, items]);

    /* ================= SAVE ================= */
    const save = useCallback(
      (newRight: string[]) => {
        onAnswerChange(JSON.stringify(newRight));
      },
      [onAnswerChange]
    );

    /* ================= BUTTON ACTIONS ================= */
    const moveRight = useCallback(() => {
      if (selectedLeft === null) return;
      const item = left[selectedLeft];

      const newLeft = left.filter((_, i) => i !== selectedLeft);
      const newRight = [...right, item];

      setLeft(newLeft);
      setRight(newRight);
      save(newRight);
      setSelectedLeft(null);
    }, [left, right, selectedLeft, save]);

    const moveLeft = useCallback(() => {
      if (selectedRight === null) return;
      const item = right[selectedRight];

      const newRight = right.filter((_, i) => i !== selectedRight);
      const newLeft = [...left, item];

      setRight(newRight);
      setLeft(newLeft);
      save(newRight);
      setSelectedRight(null);
    }, [left, right, selectedRight, save]);

    const moveUp = useCallback(() => {
      if (selectedRight === null || selectedRight === 0) return;
      const copy = [...right];
      [copy[selectedRight - 1], copy[selectedRight]] = [
        copy[selectedRight],
        copy[selectedRight - 1],
      ];
      setRight(copy);
      save(copy);
      setSelectedRight(selectedRight - 1);
    }, [right, selectedRight, save]);

    const moveDown = useCallback(() => {
      if (selectedRight === null || selectedRight === right.length - 1)
        return;
      const copy = [...right];
      [copy[selectedRight + 1], copy[selectedRight]] = [
        copy[selectedRight],
        copy[selectedRight + 1],
      ];
      setRight(copy);
      save(copy);
      setSelectedRight(selectedRight + 1);
    }, [right, selectedRight, save]);

    const clearAll = useCallback(() => {
      setLeft(items);
      setRight([]);
      save([]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }, [items, save]);

    /* ================= DRAG LOGIC ================= */
    const onDragStart = useCallback((
      e: React.DragEvent,
      from: 'left' | 'right',
      index: number,
      item: string
    ) => {
      dragItemRef.current = { from, index, item };
      setDraggingId(`${from}-${index}`);
      e.dataTransfer.effectAllowed = 'move';

      // Create ghost image
      const ghost = document.createElement('div');
      ghost.textContent = item;
      ghost.style.cssText = `
        position: absolute;
        top: -1000px;
        left: -1000px;
        background: white;
        padding: 12px 16px;
        border-radius: 8px;
        border: 2px solid #3b82f6;
        font-weight: 500;
        color: #1e40af;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 200px;
        max-width: 300px;
        white-space: normal;
        word-wrap: break-word;
      `;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 60, 25);

      setTimeout(() => document.body.removeChild(ghost), 0);
    }, []);

    const onDragEnd = useCallback(() => {
      setDraggingId(null);
      setHoverZone(null);
      dragItemRef.current = null;
    }, []);

    const onDropToLeft = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      if (isCompleted || !dragItemRef.current) return;

      const { from, index, item } = dragItemRef.current;

      if (from === 'right') {
        // Animate removal from right
        setRight(prev => {
          const newRight = prev.filter((_, i) => i !== index);
          save(newRight);
          return newRight;
        });

        // Animate addition to left
        setTimeout(() => {
          setLeft(prev => [...prev, item]);
        }, 150);
      }

      onDragEnd();
    }, [isCompleted, save, onDragEnd]);

    const onDropToRight = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      if (isCompleted || !dragItemRef.current) return;

      const { from, index, item } = dragItemRef.current;

      if (from === 'left') {
        // Animate removal from left
        setLeft(prev => prev.filter((_, i) => i !== index));

        // Animate addition to right
        setTimeout(() => {
          setRight(prev => {
            const newRight = [...prev, item];
            save(newRight);
            return newRight;
          });
        }, 150);
      }

      onDragEnd();
    }, [isCompleted, save, onDragEnd]);

    const onReorderRight = useCallback((dropIndex: number) => {
      if (!dragItemRef.current || dragItemRef.current.from !== 'right') return;

      const { index } = dragItemRef.current;
      if (index === dropIndex) return;

      const copy = [...right];
      const [moved] = copy.splice(index, 1);
      copy.splice(dropIndex, 0, moved);

      setRight(copy);
      save(copy);
      onDragEnd();
    }, [right, save, onDragEnd]);

    /* ================= UI COMPONENTS ================= */
    const renderItem = useCallback((
      item: string,
      index: number,
      side: 'left' | 'right',
      isSelected: boolean
    ) => {
      const isDragging = draggingId === `${side}-${index}`;
      const handleClick = () => {
        if (side === 'left') {
          setSelectedLeft(index);
          setSelectedRight(null);
        } else {
          setSelectedRight(index);
          setSelectedLeft(null);
        }
      };

      return (
        <motion.div
          key={`${side}-${index}`}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isDragging ? 0.5 : 1,
            y: 0,
            scale: isDragging ? 0.95 : isSelected ? 0.98 : 1,
            borderColor: isSelected ? '#3b82f6' : '#e2e8f0'
          }}
          whileHover={{
            scale: isDragging ? 0.90 : 0.95,
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-move transition-all ${isSelected
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
            } ${isDragging ? 'shadow-2xl z-10' : ''}`}
          onClick={handleClick}
          draggable={!isCompleted}
          onDragStart={(e) => onDragStart(e, side, index, item)}
          onDragEnd={onDragEnd}
        >
          <div className="flex items-center gap-3">
            {/* <div className="flex flex-col items-center">
              <GripVertical className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {side === 'right' ? index + 1 : ''}
              </span>
            </div> */}

            <div className="flex-1">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: item }}
              />
            </div>
          </div>

          {/* Selection indicator */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </motion.div>
      );
    }, [draggingId, isCompleted, onDragStart, onDragEnd]);

    return (
      <div className="space-y-4">

        {/* Main container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel - Unordered items */}
          <div
            className={`lg:col-span-5 rounded-2xl border-2 p-4 transition-all duration-300 ${hoverZone === 'left'
                ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30'
              }`}
            onDragOver={(e) => {
              e.preventDefault();
              setHoverZone('left');
            }}
            onDragLeave={() => setHoverZone(null)}
            onDrop={onDropToLeft}
          >
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              <AnimatePresence>
                {left.map((item, idx) =>
                  renderItem(item, idx, 'left', selectedLeft === idx)
                )}
              </AnimatePresence>

              {left.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-slate-400 dark:text-slate-500"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="font-medium">All items moved to correct order!</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Control panel */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4 p-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={moveRight}
              disabled={selectedLeft === null || isCompleted}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Move selected to right"
            >
              <ArrowRight className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={moveLeft}
              disabled={selectedRight === null || isCompleted}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Move selected to left"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>

            <div className="h-px w-16 bg-slate-300 dark:bg-slate-700 my-2"></div>

            <motion.button
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={moveUp}
              disabled={selectedRight === null || selectedRight === 0 || isCompleted}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Move item up"
            >
              <ChevronUp className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, y: 3 }}
              whileTap={{ scale: 0.95 }}
              onClick={moveDown}
              disabled={selectedRight === null || selectedRight === right.length - 1 || isCompleted}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Move item down"
            >
              <ChevronDown className="w-6 h-6" />
            </motion.button>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Hint: You can also drag items directly
              </p>
              <ArrowUpDown className="w-5 h-5 text-slate-400 mx-auto" />
            </div>
          </div>

          {/* Right panel - Ordered items */}
          <div
            className={`lg:col-span-5 rounded-2xl border-2 p-4 transition-all duration-300 ${hoverZone === 'right'
                ? 'border-green-400 dark:border-green-500 bg-green-50/50 dark:bg-green-900/20 shadow-lg'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
              }`}
            onDragOver={(e) => {
              e.preventDefault();
              setHoverZone('right');
            }}
            onDragLeave={() => setHoverZone(null)}
            onDrop={onDropToRight}
          >
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              <AnimatePresence>
                {right.map((item, idx) => (
                  <motion.div
                    key={`right-${idx}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderTop = '2px dashed #10b981';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderTop = 'none';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderTop = 'none';
                      onReorderRight(idx);
                    }}
                  >
                    {renderItem(item, idx, 'right', selectedRight === idx)}
                  </motion.div>
                ))}
              </AnimatePresence>

              {right.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="font-medium text-slate-600 dark:text-slate-400">
                    Drag items here or use → button
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>


        {/* Drag hint */}
        {draggingId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-xl z-50"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  x: [0, 5, 0],
                  transition: { repeat: Infinity, duration: 1 }
                }}
              >
                👆
              </motion.div>
              <span className="font-medium">Drop anywhere in the {hoverZone === 'left' ? 'left' : 'right'} panel</span>
              <motion.div
                animate={{
                  x: [0, -5, 0],
                  transition: { repeat: Infinity, duration: 1 }
                }}
              >
                👆
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
);

interface PTEFillSelectProps {
  questionHTML: string;
  optionsText: string; // "a, b, c, d"
  currentAnswer: string;
  isCompleted: boolean;
  onAnswerChange: (answer: string) => void;
}

export const PTEFillSelect: React.FC<PTEFillSelectProps> = memo(
  ({
    questionHTML,
    optionsText,
    currentAnswer,
    isCompleted,
    onAnswerChange,
  }) => {
    const initializedRef = useRef(false);

    /* ========== OPTIONS ========== */
    const options = useMemo(() => {
      return optionsText
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    }, [optionsText]);

    /* ========== ANSWERS STATE ========== */
    const [answers, setAnswers] = useState<Record<string, string>>({});

    /* ========== INIT ONCE ========== */
    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      if (currentAnswer) {
        try {
          const parsed = JSON.parse(currentAnswer);
          if (parsed && typeof parsed === "object") {
            setAnswers(parsed);
          }
        } catch { }
      }
    }, []);

    /* ========== UPDATE ANSWER ========== */
    const updateAnswer = useCallback(
      (key: string, value: string) => {
        setAnswers((prev) => {
          const next = { ...prev, [key]: value };
          onAnswerChange(JSON.stringify(next));
          return next;
        });
      },
      [onAnswerChange]
    );

    /* ========== RENDER HTML WITH SELECTS ========== */
    const renderedContent = useMemo(() => {
      if (!questionHTML) return null;

      const regex = /\{\{(\d+)\}\}/g;
      const parts: React.ReactNode[] = [];

      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(questionHTML)) !== null) {
        const index = match.index;
        const key = match[1];

        const beforeHTML = questionHTML.slice(lastIndex, index);
        if (beforeHTML) {
          parts.push(
            <span
              key={`html-${index}`}
              dangerouslySetInnerHTML={{ __html: beforeHTML }}
            />
          );
        }

        parts.push(
          <select
            key={`select-${key}`}
            disabled={isCompleted}
            value={answers[key] || ""}
            onChange={(e) => updateAnswer(key, e.target.value)}
            className="mx-1 px-2 py-1 border rounded-md bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-sm"
          >
            <option value="">---</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

        lastIndex = index + match[0].length;
      }

      const remainingHTML = questionHTML.slice(lastIndex);
      if (remainingHTML) {
        parts.push(
          <span
            key="html-end"
            dangerouslySetInnerHTML={{ __html: remainingHTML }}
          />
        );
      }

      return parts;
    }, [questionHTML, options, answers, isCompleted, updateAnswer]);

    return (
      <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
        {renderedContent}
      </div>
    );
  }
);


interface PTEHighlightTextProps {
  html: string;              // qDoc.questionText (HTML)
  currentAnswer: string;     // saved highlighted HTML
  isCompleted: boolean;
  onAnswerChange: (answer: string) => void;
}

const HIGHLIGHT_CLASS = "pte-highlight";

export const PTEHighlightText: React.FC<PTEHighlightTextProps> = memo(
  ({ html, currentAnswer, isCompleted, onAnswerChange }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const htmlRef = useRef<string>("");

    /* ================= INIT (NO STATE, NO RE-RENDER) ================= */
    useEffect(() => {
      if (!containerRef.current) return;

      const initialHTML = currentAnswer || html;
      containerRef.current.innerHTML = initialHTML;
      htmlRef.current = initialHTML;
    }, [html, currentAnswer]);

    /* ================= SAVE ANSWER SILENTLY ================= */
    const save = useCallback(() => {
      if (!containerRef.current) return;
      htmlRef.current = containerRef.current.innerHTML;
      onAnswerChange(htmlRef.current);
    }, [onAnswerChange]);

    /* ================= APPLY HIGHLIGHT ================= */
    const applyHighlight = useCallback(() => {
      if (isCompleted) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);

      // Ensure selection is inside our container
      if (
        !containerRef.current ||
        !containerRef.current.contains(range.commonAncestorContainer)
      ) {
        selection.removeAllRanges();
        return;
      }

      // Prevent nested highlights
      const parentEl =
        range.commonAncestorContainer.parentElement as HTMLElement | null;
      if (parentEl?.classList?.contains(HIGHLIGHT_CLASS)) {
        selection.removeAllRanges();
        return;
      }

      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.style.backgroundColor = "#fde047"; // yellow-300
      span.style.borderRadius = "3px";
      span.style.padding = "0 2px";
      span.style.cursor = "pointer";

      try {
        range.surroundContents(span);
        selection.removeAllRanges();
        save();
      } catch {
        // Invalid DOM range (cross-node selection)
        selection.removeAllRanges();
      }
    }, [isCompleted, save]);

    /* ================= REMOVE SINGLE HIGHLIGHT ================= */
    const removeHighlight = useCallback(
      (e: React.MouseEvent) => {
        if (isCompleted) return;

        const target = e.target as HTMLElement;
        if (!target.classList.contains(HIGHLIGHT_CLASS)) return;

        const parent = target.parentNode;
        while (target.firstChild) {
          parent?.insertBefore(target.firstChild, target);
        }
        parent?.removeChild(target);

        save();
      },
      [isCompleted, save]
    );

    /* ================= CLEAR ALL HIGHLIGHTS ================= */
    const clearAllHighlights = useCallback(() => {
      if (!containerRef.current || isCompleted) return;

      const highlights =
        containerRef.current.querySelectorAll(`.${HIGHLIGHT_CLASS}`);

      highlights.forEach((span) => {
        const parent = span.parentNode;
        while (span.firstChild) {
          parent?.insertBefore(span.firstChild, span);
        }
        parent?.removeChild(span);
      });

      save();
    }, [isCompleted, save]);

    return (
      <div>
        {/* Clear button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={clearAllHighlights}
            disabled={isCompleted}
            className="text-sm px-3 py-1 rounded-md border border-slate-400
                       hover:bg-slate-100 dark:hover:bg-slate-800
                       disabled:opacity-50"
          >
            Clear highlights
          </button>
        </div>

        {/* Highlightable text */}
        <div
          ref={containerRef}
          className="prose prose-lg dark:prose-invert max-w-none
                     leading-relaxed select-text cursor-text"
          onMouseUp={applyHighlight}
          onClick={removeHighlight}
        />
      </div>
    );
  }
);


interface PTEFillListeningInputProps {
  questionHTML: string;      // qDoc.questionText (HTML with {{1}})
  currentAnswer: string;     // saved JSON string
  isCompleted: boolean;
  onAnswerChange: (answer: string) => void;
}

export const PTEFillListeningInput: React.FC<PTEFillListeningInputProps> = memo(
  ({ questionHTML, currentAnswer, isCompleted, onAnswerChange }) => {
    const initializedRef = useRef(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    /* ================= INIT ONCE ================= */
    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      if (currentAnswer) {
        try {
          const parsed = JSON.parse(currentAnswer);
          if (parsed && typeof parsed === "object") {
            setAnswers(parsed);
          }
        } catch { }
      }
    }, []);

    /* ================= UPDATE ANSWER ================= */
    const updateAnswer = useCallback(
      (key: string, value: string) => {
        setAnswers((prev) => {
          const next = { ...prev, [key]: value };
          onAnswerChange(JSON.stringify(next));
          return next;
        });
      },
      [onAnswerChange]
    );

    /* ================= RENDER HTML + INPUTS ================= */
    const renderedContent = useMemo(() => {
      if (!questionHTML) return null;

      const regex = /\{\{(\d+)\}\}/g;
      const parts: React.ReactNode[] = [];

      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(questionHTML)) !== null) {
        const index = match.index;
        const key = match[1];

        const htmlBefore = questionHTML.slice(lastIndex, index);
        if (htmlBefore) {
          parts.push(
            <span
              key={`html-${index}`}
              dangerouslySetInnerHTML={{ __html: htmlBefore }}
            />
          );
        }

        parts.push(
          <input
            key={`input-${key}`}
            type="text"
            disabled={isCompleted}
            value={answers[key] || ""}
            onChange={(e) => updateAnswer(key, e.target.value)}
            className="mx-1 px-2 py-1 w-28 text-sm border-b-2 border-slate-500
                       bg-transparent outline-none focus:border-indigo-600
                       disabled:opacity-60"
            placeholder={``}
          />
        );

        lastIndex = index + match[0].length;
      }

      const remainingHTML = questionHTML.slice(lastIndex);
      if (remainingHTML) {
        parts.push(
          <span
            key="html-end"
            dangerouslySetInnerHTML={{ __html: remainingHTML }}
          />
        );
      }

      return parts;
    }, [questionHTML, answers, isCompleted, updateAnswer]);

    return (
      <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
        {renderedContent}
      </div>
    );
  }
);



