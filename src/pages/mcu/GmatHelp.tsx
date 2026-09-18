import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface GmatHelpModalProps {
  open: boolean;
  onClose: () => void;
}

const TABS = [
  "Screen Layout and Navigation",
  "GMAT™ Exam Questions",
  "Timing and Optional Breaks",
  "Testing Rules",
  "Review & Edit",
];

export default function GmatHelpModal({ open, onClose }: GmatHelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [position, setPosition] = useState({ x: 200, y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  if (!open) return null;

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const onMouseUp = () => setDragging(false);

  return (
    <div
      className="fixed inset-0 z-[80]"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div
        ref={modalRef}
        style={{ left: position.x, top: position.y }}
        className="absolute w-[720px] h-[520px] bg-[#0a8cbd] rounded shadow-2xl border border-slate-300 flex flex-col"
      >
        {/* Header (Draggable) */}
        <div
          onMouseDown={onMouseDown}
          className="cursor-move flex items-center justify-between px-4 py-2 bg-[#0a8cbd] text-white font-semibold"
        >
          Help
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 px-3 py-2 bg-white border-b">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-sm font-semibold rounded ${activeTab === tab
                ? "bg-yellow-400 text-black"
                : "bg-blue-100 text-blue-900 hover:bg-blue-200"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white p-4 overflow-y-auto text-sm text-slate-800">
          {activeTab === "Screen Layout and Navigation" && (
            <>
              <h2 className="text-lg font-bold mb-2">
                Screen Layout and Navigation
              </h2>
              <p className="mb-3">
                For any timed section of the exam, your remaining time appears
                in the upper-right corner.
              </p>
              <p className="mb-3">
                Below the time, the question counter shows your current question
                number.
              </p>
              <p>
                You may minimize these indicators by clicking on them. A warning
                appears when 5 minutes remain.
              </p>
            </>
          )}

          {activeTab === "GMAT™ Exam Questions" && (
            <>
              <h2 className="text-lg font-bold mb-2">GMAT™ Exam Questions</h2>
              <p>
                Each question must be answered before proceeding. You may mark
                questions for review.
              </p>
            </>
          )}

          {activeTab === "Timing and Optional Breaks" && (
            <>
              <h2 className="text-lg font-bold mb-2">
                Timing and Optional Breaks
              </h2>
              <p>
                You may take one optional 10-minute break. Timing continues
                automatically if skipped.
              </p>
            </>
          )}

          {activeTab === "Testing Rules" && (
            <>
              <h2 className="text-lg font-bold mb-2">Testing Rules</h2>
              <p>
                Do not refresh the browser. Use only the provided navigation
                controls.
              </p>
            </>
          )}

          {activeTab === "Review & Edit" && (
            <>
              <h2 className="text-lg font-bold mb-2">Review & Edit</h2>
              <p>
                You can edit up to 3 answers per section during the review
                phase.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0a8cbd] text-right">
          <button
            onClick={onClose}
            className="bg-white text-black px-4 py-1 rounded font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

// export function GmatWhiteboardModal({
//   open,
//   onClose,
// }: any) {
//   const modalRef = useRef<HTMLDivElement>(null);

//   const [position, setPosition] = useState({ x: 180, y: 100 });
//   const [dragging, setDragging] = useState(false);
//   const dragOffset = useRef({ x: 0, y: 0 });

//   if (!open) return null;

//   const onMouseDown = (e: React.MouseEvent) => {
//     setDragging(true);

//     dragOffset.current = {
//       x: e.clientX - position.x,
//       y: e.clientY - position.y,
//     };
//   };

//   const onMouseMove = (e: React.MouseEvent) => {
//     if (!dragging) return;

//     setPosition({
//       x: e.clientX - dragOffset.current.x,
//       y: e.clientY - dragOffset.current.y,
//     });
//   };

//   const onMouseUp = () => {
//     setDragging(false);
//   };

//   return (
//     <div
//       className="fixed inset-0 z-[90] pointer-events-none"
//       onMouseMove={onMouseMove}
//       onMouseUp={onMouseUp}
//     >
//       <div
//         ref={modalRef}
//         style={{
//           left: position.x,
//           top: position.y,
//         }}
//         className="
//           absolute
//           w-[calc(100vw-20px)]
//           h-[calc(100vh-20px)]
//           max-w-[700px]
//           max-h-[560px]
//           bg-white
//           rounded-lg
//           shadow-2xl
//           flex
//           flex-col
//           pointer-events-auto
//           overflow-hidden

//           sm:w-[700px]
//           sm:h-[560px]
//         "
//       >
//         {/* Header */}
//         <div
//           onMouseDown={onMouseDown}
//           className="
//             flex
//             items-center
//             justify-between
//             px-3
//             sm:px-4
//             py-2
//             bg-gray-600
//             text-white
//             font-semibold
//             select-none
//             cursor-move
//             shrink-0
//           "
//         >
//           <span className="text-sm sm:text-base">
//             Whiteboard
//           </span>

//           <button
//             type="button"
//             onMouseDown={(e) => e.stopPropagation()}
//             onClick={onClose}
//             className="
//               p-1
//               rounded
//               hover:bg-gray-700
//               active:bg-gray-700
//             "
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Excalidraw */}
//         <div className="flex-1 relative min-h-0">
//           <Excalidraw autoFocus />
//         </div>
//       </div>
//     </div>
//   );
// }


export function GmatWhiteboardModal({
  open,
  onClose,
}: any) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({
    x: 180,
    y: 100,
  });

  const dragging = useRef(false);
  const dragOffset = useRef({
    x: 0,
    y: 0,
  });

  const animationFrame = useRef<number | null>(null);

  const pendingPosition = useRef({
    x: 180,
    y: 100,
  });

  useEffect(() => {
    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }

      document.body.style.userSelect = "";
    };
  }, []);

  if (!open) return null;

  /* ───────── Smooth Drag ───────── */

  const onPointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if ((e.target as HTMLElement).closest("button")) return;

    e.preventDefault();

    dragging.current = true;

    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    pendingPosition.current = {
      ...position,
    };

    e.currentTarget.setPointerCapture(e.pointerId);

    document.body.style.userSelect = "none";
  };

  const onPointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragging.current) return;

    pendingPosition.current = {
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    };

    if (animationFrame.current === null) {
      animationFrame.current = requestAnimationFrame(() => {
        if (modalRef.current) {
          const { x, y } = pendingPosition.current;

          modalRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }

        animationFrame.current = null;
      });
    }
  };

  const onPointerUp = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragging.current) return;

    dragging.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer capture may already be released.
    }

    setPosition(pendingPosition.current);

    document.body.style.userSelect = "";

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <div
        ref={modalRef}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          willChange: "transform",
        }}
        className="
          absolute
          w-[calc(100vw-20px)]
          h-[calc(100vh-20px)]
          max-w-[700px]
          max-h-[560px]
          bg-white
          rounded-lg
          shadow-2xl
          flex
          flex-col
          pointer-events-auto
          overflow-hidden
          sm:w-[700px]
          sm:h-[560px]
        "
      >
        {/* Header */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="
            flex
            items-center
            justify-between
            px-3
            sm:px-4
            py-2
            bg-gray-600
            text-white
            font-semibold
            select-none
            cursor-move
            shrink-0
            touch-none
          "
        >
          <span className="text-sm sm:text-base">
            Whiteboard
          </span>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="
              p-1
              rounded
              hover:bg-gray-700
              active:bg-gray-700
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Excalidraw */}
        <div className="flex-1 relative min-h-0">
          <Excalidraw autoFocus />
        </div>
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type Op = "+" | "-" | "*" | "/" | null;



// export function GmatCalculatorModal({ open, onClose }: Props) {
//   const [pos, setPos] = useState({ x: 220, y: 120 });
//   const [dragging, setDragging] = useState(false);
//   const drag = useRef({ x: 0, y: 0 });

//   const [display, setDisplay] = useState("0");
//   const [expression, setExpression] = useState(""); // shows full calculation
//   const [acc, setAcc] = useState<number | null>(null);
//   const [op, setOp] = useState<Op>(null);
//   const [reset, setReset] = useState(false);

//   const [memory, setMemory] = useState(0);
//   const [mrcPressed, setMrcPressed] = useState(false);

//   if (!open) return null;

//   /* ───────── Helpers ───────── */
//   const formatNumber = (num: number): string => {
//     if (!isFinite(num)) return "Error";
//     if (Number.isInteger(num)) return num.toString();
//     return parseFloat(num.toFixed(3)).toString();
//   };

//   const opSymbol = (operator: Op): string => {
//     if (operator === "+") return "+";
//     if (operator === "-") return "−";
//     if (operator === "*") return "×";
//     if (operator === "/") return "÷";
//     return "";
//   };

//   /* ───────── Drag ───────── */
//   const start = (e: React.MouseEvent) => {
//     setDragging(true);
//     drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
//   };
//   const move = (e: React.MouseEvent) =>
//     dragging &&
//     setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
//   const stop = () => setDragging(false);

//   /* ───────── Logic ───────── */
//   const num = (n: string) => {
//     let newDisplay: string;
//     if (reset) {
//       newDisplay = n;
//       setReset(false);
//     } else {
//       newDisplay = display === "0" ? n : display + n;
//     }
//     setDisplay(newDisplay);
//     setMrcPressed(false);

//     // Update expression to show current number being typed
//     if (acc !== null && op) {
//       setExpression(`${formatNumber(acc)} ${opSymbol(op)} ${newDisplay}`);
//     } else {
//       setExpression("");
//     }
//   };

//   const dot = () => {
//     if (reset) {
//       setDisplay("0.");
//       setReset(false);
//     } else if (!display.includes(".")) {
//       setDisplay(display + ".");
//     }
//     setMrcPressed(false);

//     if (acc !== null && op) {
//       setExpression(`${formatNumber(acc)} ${opSymbol(op)} ${display}`);
//     }
//   };

//   const clear = () => {
//     setDisplay("0");
//     setExpression("");
//     setAcc(null);
//     setOp(null);
//     setReset(false);
//     setMrcPressed(false);
//   };

//   const sign = () => {
//     const val = parseFloat(display);
//     if (!isNaN(val)) {
//       const newVal = formatNumber(val * -1);
//       setDisplay(newVal);
//       if (acc !== null && op) {
//         setExpression(`${formatNumber(acc)} ${opSymbol(op)} ${newVal}`);
//       }
//     }
//     setMrcPressed(false);
//   };

//   const percent = () => {
//     const val = parseFloat(display);
//     if (!isNaN(val)) {
//       const newVal = formatNumber(val / 100);
//       setDisplay(newVal);
//       if (acc !== null && op) {
//         setExpression(`${formatNumber(acc)} ${opSymbol(op)} ${newVal}`);
//       }
//     }
//     setMrcPressed(false);
//   };

//   const sqrt = () => {
//     const val = parseFloat(display);
//     if (!isNaN(val) && val >= 0) {
//       const newVal = formatNumber(Math.sqrt(val));
//       setDisplay(newVal);
//       setExpression(`√(${display}) =`);
//     } else {
//       setDisplay("Error");
//       setExpression("");
//     }
//     setReset(true);
//     setMrcPressed(false);
//   };

//   const operate = (nextOp: Op) => {
//     const cur = parseFloat(display);
//     if (isNaN(cur) && display !== "Error") return;

//     if (display === "Error") {
//       clear();
//       return;
//     }

//     if (acc === null) {
//       // First operator press: store current value as accumulator
//       setAcc(cur);
//       setOp(nextOp);
//       setExpression(`${formatNumber(cur)} ${opSymbol(nextOp)}`);
//     } else if (op) {
//       // Compute intermediate result
//       let r = acc;
//       if (op === "+") r += cur;
//       if (op === "-") r -= cur;
//       if (op === "*") r *= cur;
//       if (op === "/") r = cur === 0 ? 0 : r / cur;

//       const formatted = formatNumber(r);
//       setAcc(r);
//       setDisplay(formatted);

//       if (nextOp !== null) {
//         setExpression(`${formatted} ${opSymbol(nextOp)}`);
//         setOp(nextOp);
//       } else {
//         // equals pressed (nextOp is null)
//         setExpression(`${formatNumber(acc)} ${opSymbol(op)} ${formatNumber(cur)} =`);
//         setOp(null);
//         setAcc(null);
//       }
//     } else {
//       // No pending op but acc exists (unusual) - just set new op
//       setOp(nextOp);
//       setExpression(`${formatNumber(acc)} ${opSymbol(nextOp)}`);
//     }
//     setReset(true);
//     setMrcPressed(false);
//   };

//   const equals = () => {
//     const cur = parseFloat(display);
//     if (isNaN(cur) && display !== "Error") return;

//     if (display === "Error") {
//       clear();
//       return;
//     }

//     if (acc !== null && op) {
//       let r = acc;
//       if (op === "+") r += cur;
//       if (op === "-") r -= cur;
//       if (op === "*") r *= cur;
//       if (op === "/") r = cur === 0 ? 0 : r / cur;

//       // Show the full equation in the expression line
//       setExpression(`${formatNumber(acc)} ${opSymbol(op)} ${formatNumber(cur)} =`);
//       setDisplay(formatNumber(r));
//       setAcc(r); // keep result for chaining
//       setOp(null);
//     } else {
//       // No pending operation – just show the number with "="
//       setExpression(`${formatNumber(cur)} =`);
//     }
//     setReset(true);
//     setMrcPressed(false);
//   };

//   /* ───────── Memory (TI-108 accurate) ───────── */
//   const mPlus = () => {
//     setMemory(memory + parseFloat(display));
//     setMrcPressed(false);
//   };

//   const mMinus = () => {
//     setMemory(memory - parseFloat(display));
//     setMrcPressed(false);
//   };

//   const mrc = () => {
//     if (!mrcPressed) {
//       const recalled = formatNumber(memory);
//       setDisplay(recalled);
//       setMrcPressed(true);
//       setReset(true);
//       if (acc !== null && op) {
//         setExpression(`${formatNumber(acc)} ${opSymbol(op)} ${recalled}`);
//       }
//     } else {
//       setMemory(0);
//       setMrcPressed(false);
//     }
//   };

//   /* ───────── UI ───────── */
//   return (
//     <div className="fixed z-[90]" onMouseMove={move} onMouseUp={stop}>
//       <div
//         style={{ left: pos.x, top: pos.y }}
//         className="absolute w-[280px] bg-white shadow-2xl rounded overflow-hidden"
//       >
//         {/* Title bar */}
//         <div
//           onMouseDown={start}
//           className="cursor-grab active:cursor-grabbing flex justify-between items-center px-4 py-3 bg-[#2d3f5e] text-white font-semibold select-none"
//         >
//           <span>Calculator</span>
//           <button
//             onClick={onClose}
//             className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         {/* Display with expression + current value */}
//         <div className="bg-[#0f1a2b] text-white px-5  min-h-[70px] flex flex-col justify-end">
//           <div className="text-sm text-blue-200/70 font-mono min-h-[10px] mb-1 text-right break-all">
//             {expression}
//           </div>
//           <div className="text-4xl font-mono font-medium text-right tracking-wide break-all">
//             {display}
//           </div>
//         </div>

//         {/* Keypad */}
//         <div className="grid grid-cols-4 gap-2.5 p-4 bg-[#1f3b63]">
//           <Btn red onClick={sign}>±</Btn>
//           <Btn red onClick={sqrt}>√</Btn>
//           <Btn red onClick={percent}>%</Btn>
//           <Btn red onClick={() => operate("/")}>÷</Btn>

//           <Btn red onClick={mrc}>MRC</Btn>
//           <Btn red onClick={mMinus}>M-</Btn>
//           <Btn red onClick={mPlus}>M+</Btn>
//           <Btn red onClick={clear}>ON/C</Btn>

//           {[7, 8, 9].map((n) => (
//             <Btn key={n} onClick={() => num(String(n))}>
//               {n}
//             </Btn>
//           ))}
//           <Btn red onClick={() => operate("*")}>×</Btn>

//           {[4, 5, 6].map((n) => (
//             <Btn key={n} onClick={() => num(String(n))}>
//               {n}
//             </Btn>
//           ))}
//           <Btn red onClick={() => operate("-")}>−</Btn>

//           {[1, 2, 3].map((n) => (
//             <Btn key={n} onClick={() => num(String(n))}>
//               {n}
//             </Btn>
//           ))}
//           <Btn red onClick={() => operate("+")}>+</Btn>

//           <Btn className="col-span-2" onClick={() => num("0")}>
//             0
//           </Btn>
//           <Btn onClick={dot}>.</Btn>
//           <Btn red onClick={equals}>=</Btn>
//         </div>
//       </div>
//     </div>
//   );
// }




export function GmatCalculatorModal({ open, onClose }: Props) {
  const [pos, setPos] = useState({ x: 220, y: 120 });

  const calculatorRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const pendingPosition = useRef({ x: 220, y: 120 });

  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [reset, setReset] = useState(false);

  const [memory, setMemory] = useState(0);
  const [mrcPressed, setMrcPressed] = useState(false);

  /* ───────── Cleanup ───────── */

  useEffect(() => {
    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }

      document.body.style.userSelect = "";
    };
  }, []);

  /* ───────── Helpers ───────── */

  const formatNumber = (num: number): string => {
    if (!isFinite(num)) return "Error";

    if (Number.isInteger(num)) return num.toString();

    return parseFloat(num.toFixed(3)).toString();
  };

  const opSymbol = (operator: Op): string => {
    if (operator === "+") return "+";
    if (operator === "-") return "−";
    if (operator === "*") return "×";
    if (operator === "/") return "÷";

    return "";
  };

  /* ───────── Smooth Drag ───────── */

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;

    e.preventDefault();

    dragging.current = true;

    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };

    pendingPosition.current = { ...pos };

    e.currentTarget.setPointerCapture(e.pointerId);

    document.body.style.userSelect = "none";
  };

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    pendingPosition.current = {
      x: newX,
      y: newY,
    };

    if (animationFrame.current === null) {
      animationFrame.current = requestAnimationFrame(() => {
        if (calculatorRef.current) {
          const { x, y } = pendingPosition.current;

          calculatorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }

        animationFrame.current = null;
      });
    }
  };

  const stop = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;

    dragging.current = false;

    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already be released.
      }
    }

    const finalPosition = pendingPosition.current;

    setPos(finalPosition);

    document.body.style.userSelect = "";

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

  /* ───────── Calculator Logic ───────── */

  const num = (n: string) => {
    let newDisplay: string;

    if (reset) {
      newDisplay = n;
      setReset(false);
    } else {
      newDisplay = display === "0" ? n : display + n;
    }

    setDisplay(newDisplay);
    setMrcPressed(false);

    if (acc !== null && op) {
      setExpression(
        `${formatNumber(acc)} ${opSymbol(op)} ${newDisplay}`
      );
    } else {
      setExpression("");
    }
  };

  const dot = () => {
    let newDisplay = display;

    if (reset) {
      newDisplay = "0.";
      setReset(false);
    } else if (!display.includes(".")) {
      newDisplay = display + ".";
    }

    setDisplay(newDisplay);
    setMrcPressed(false);

    if (acc !== null && op) {
      setExpression(
        `${formatNumber(acc)} ${opSymbol(op)} ${newDisplay}`
      );
    }
  };

  const clear = () => {
    setDisplay("0");
    setExpression("");
    setAcc(null);
    setOp(null);
    setReset(false);
    setMrcPressed(false);
  };

  const sign = () => {
    const val = parseFloat(display);

    if (!isNaN(val)) {
      const newVal = formatNumber(val * -1);

      setDisplay(newVal);

      if (acc !== null && op) {
        setExpression(
          `${formatNumber(acc)} ${opSymbol(op)} ${newVal}`
        );
      }
    }

    setMrcPressed(false);
  };

  const percent = () => {
    const val = parseFloat(display);

    if (!isNaN(val)) {
      const newVal = formatNumber(val / 100);

      setDisplay(newVal);

      if (acc !== null && op) {
        setExpression(
          `${formatNumber(acc)} ${opSymbol(op)} ${newVal}`
        );
      }
    }

    setMrcPressed(false);
  };

  const sqrt = () => {
    const val = parseFloat(display);

    if (!isNaN(val) && val >= 0) {
      const newVal = formatNumber(Math.sqrt(val));

      setDisplay(newVal);
      setExpression(`√(${display}) =`);
    } else {
      setDisplay("Error");
      setExpression("");
    }

    setReset(true);
    setMrcPressed(false);
  };

  const calculate = (
    first: number,
    operator: Op,
    second: number
  ): number => {
    if (operator === "+") return first + second;
    if (operator === "-") return first - second;
    if (operator === "*") return first * second;
    if (operator === "/") {
      return second === 0 ? Infinity : first / second;
    }

    return second;
  };

  const operate = (nextOp: Op) => {
    const cur = parseFloat(display);

    if (isNaN(cur) && display !== "Error") return;

    if (display === "Error") {
      clear();
      return;
    }

    if (acc === null) {
      setAcc(cur);
      setOp(nextOp);
      setExpression(`${formatNumber(cur)} ${opSymbol(nextOp)}`);
    } else if (op) {
      const r = calculate(acc, op, cur);
      const formatted = formatNumber(r);

      setAcc(r);
      setDisplay(formatted);

      if (nextOp !== null) {
        setExpression(`${formatted} ${opSymbol(nextOp)}`);
        setOp(nextOp);
      } else {
        setExpression(
          `${formatNumber(acc)} ${opSymbol(op)} ${formatNumber(cur)} =`
        );

        setOp(null);
        setAcc(null);
      }
    } else {
      setOp(nextOp);
      setExpression(`${formatNumber(acc)} ${opSymbol(nextOp)}`);
    }

    setReset(true);
    setMrcPressed(false);
  };

  const equals = () => {
    const cur = parseFloat(display);

    if (isNaN(cur) && display !== "Error") return;

    if (display === "Error") {
      clear();
      return;
    }

    if (acc !== null && op) {
      const r = calculate(acc, op, cur);

      setExpression(
        `${formatNumber(acc)} ${opSymbol(op)} ${formatNumber(cur)} =`
      );

      setDisplay(formatNumber(r));
      setAcc(r);
      setOp(null);
    } else {
      setExpression(`${formatNumber(cur)} =`);
    }

    setReset(true);
    setMrcPressed(false);
  };

  /* ───────── Memory ───────── */

  const mPlus = () => {
    const value = parseFloat(display);

    if (!isNaN(value)) {
      setMemory((prev) => prev + value);
    }

    setMrcPressed(false);
  };

  const mMinus = () => {
    const value = parseFloat(display);

    if (!isNaN(value)) {
      setMemory((prev) => prev - value);
    }

    setMrcPressed(false);
  };

  const mrc = () => {
    if (!mrcPressed) {
      const recalled = formatNumber(memory);

      setDisplay(recalled);
      setMrcPressed(true);
      setReset(true);

      if (acc !== null && op) {
        setExpression(
          `${formatNumber(acc)} ${opSymbol(op)} ${recalled}`
        );
      }
    } else {
      setMemory(0);
      setMrcPressed(false);
    }
  };

  /* ───────── UI ───────── */

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <div
        ref={calculatorRef}
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          willChange: "transform",
        }}
        className="absolute w-[280px] bg-white shadow-2xl rounded overflow-hidden pointer-events-auto"
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
      >
        {/* Title Bar */}

        <div
          onPointerDown={start}
          className="cursor-grab active:cursor-grabbing flex justify-between items-center px-4 py-3 bg-[#2d3f5e] text-white font-semibold select-none touch-none"
        >
          <span>Calculator</span>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Display */}

        <div className="bg-[#0f1a2b] text-white px-5 min-h-[70px] flex flex-col justify-end">
          <div className="text-sm text-blue-200/70 font-mono min-h-[10px] mb-1 text-right break-all">
            {expression}
          </div>

          <div className="text-4xl font-mono font-medium text-right tracking-wide break-all">
            {display}
          </div>
        </div>

        {/* Keypad */}

        <div className="grid grid-cols-4 gap-2.5 p-4 bg-[#1f3b63]">
          <Btn red onClick={sign}>
            ±
          </Btn>

          <Btn red onClick={sqrt}>
            √
          </Btn>

          <Btn red onClick={percent}>
            %
          </Btn>

          <Btn red onClick={() => operate("/")}>
            ÷
          </Btn>

          <Btn red onClick={mrc}>
            MRC
          </Btn>

          <Btn red onClick={mMinus}>
            M-
          </Btn>

          <Btn red onClick={mPlus}>
            M+
          </Btn>

          <Btn red onClick={clear}>
            ON/C
          </Btn>

          {[7, 8, 9].map((n) => (
            <Btn key={n} onClick={() => num(String(n))}>
              {n}
            </Btn>
          ))}

          <Btn red onClick={() => operate("*")}>
            ×
          </Btn>

          {[4, 5, 6].map((n) => (
            <Btn key={n} onClick={() => num(String(n))}>
              {n}
            </Btn>
          ))}

          <Btn red onClick={() => operate("-")}>
            −
          </Btn>

          {[1, 2, 3].map((n) => (
            <Btn key={n} onClick={() => num(String(n))}>
              {n}
            </Btn>
          ))}

          <Btn red onClick={() => operate("+")}>
            +
          </Btn>

          <Btn className="col-span-2" onClick={() => num("0")}>
            0
          </Btn>

          <Btn onClick={dot}>.</Btn>

          <Btn red onClick={equals}>
            =
          </Btn>
        </div>
      </div>
    </div>
  );
}




function Btn({
  children,
  onClick,
  red,
  className = "",
}: any) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded font-bold text-lg ${red ? "bg-red-500 text-white" : "bg-white text-black"
        } ${className}`}
    >
      {children}
    </button>
  );
}