import React, { useRef, useState } from "react";
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


import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface GmatWhiteboardModalProps {
  open: boolean;
  onClose: () => void;
}

export function GmatWhiteboardModal({
  open,
  onClose,
}: GmatWhiteboardModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 180, y: 100 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  if (!open) return null;

  /* ---------------- Drag logic (header only) ---------------- */
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
      className="fixed inset-0 z-[90]"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div
        ref={modalRef}
        style={{ left: position.x, top: position.y }}
        className="absolute w-[700px] h-[560px] bg-white rounded shadow-2xl flex flex-col"
      >
        <div
          onMouseDown={onMouseDown}
          className="cursor-pointer flex items-center justify-between px-4 py-2 bg-gray-600 text-white font-semibold select-none"
        >
          Whiteboard
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 relative">
          <Tldraw
            autoFocus
            inferDarkMode={false}
            hideUi={false}
            onMount={(editor) => {
              editor.setCamera({ x: 0, y: 0, z: 1 });
            }}
          />
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

export function GmatCalculatorModal({ open, onClose }: Props) {
  const [pos, setPos] = useState({ x: 220, y: 120 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ x: 0, y: 0 });

  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [reset, setReset] = useState(false);

  const [memory, setMemory] = useState(0);
  const [mrcPressed, setMrcPressed] = useState(false);

  if (!open) return null;

  /* ───────── Drag ───────── */
  const start = (e: React.MouseEvent) => {
    setDragging(true);
    drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const move = (e: React.MouseEvent) =>
    dragging &&
    setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  const stop = () => setDragging(false);

  /* ───────── Logic ───────── */
  const num = (n: string) => {
    if (reset) {
      setDisplay(n);
      setReset(false);
    } else {
      setDisplay(display === "0" ? n : display + n);
    }
    setMrcPressed(false);
  };

  const dot = () => !display.includes(".") && setDisplay(display + ".");

  const clear = () => {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setReset(false);
    setMrcPressed(false);
  };

  const sign = () => setDisplay(String(parseFloat(display) * -1));
  const percent = () => setDisplay(String(parseFloat(display) / 100));
  const sqrt = () => {
    setDisplay(String(Math.sqrt(parseFloat(display))));
    setReset(true);
  };

  const operate = (nextOp: Op) => {
    const cur = parseFloat(display);
    if (acc === null) setAcc(cur);
    else if (op) {
      let r = acc;
      if (op === "+") r += cur;
      if (op === "-") r -= cur;
      if (op === "*") r *= cur;
      if (op === "/") r = cur === 0 ? 0 : r / cur;
      setAcc(r);
      setDisplay(String(r));
    }
    setOp(nextOp);
    setReset(true);
    setMrcPressed(false);
  };

  const equals = () => operate(null);

  /* ───────── Memory (TI-108 accurate) ───────── */
  const mPlus = () => setMemory(memory + parseFloat(display));
  const mMinus = () => setMemory(memory - parseFloat(display));
  const mrc = () => {
    if (!mrcPressed) {
      setDisplay(String(memory));
      setMrcPressed(true);
      setReset(true);
    } else {
      setMemory(0);
      setMrcPressed(false);
    }
  };

  /* ───────── UI ───────── */
  return (
    <div className="fixed inset-0 z-[90]" onMouseMove={move} onMouseUp={stop}>
      <div
        style={{ left: pos.x, top: pos.y }}
        className="absolute w-[300px] bg-white shadow-2xl"
      >
        <div
          onMouseDown={start}
          className="cursor-pointer flex justify-between items-center px-3 py-2 bg-gray-600 text-white font-semibold select-none"
        >
          Calculator
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="bg-[#1e293b] text-white text-3xl text-right px-3 py-4 font-mono">
          {display}
        </div>

        <div className="grid grid-cols-4 gap-2 p-3 bg-[#1f3b63]">
          <Btn red onClick={sign}>±</Btn>
          <Btn red onClick={sqrt}>√</Btn>
          <Btn red onClick={percent}>%</Btn>
          <Btn red onClick={() => operate("/")}>÷</Btn>

          <Btn red onClick={mrc}>MRC</Btn>
          <Btn red onClick={mMinus}>M-</Btn>
          <Btn red onClick={mPlus}>M+</Btn>
          <Btn red onClick={clear}>ON/C</Btn>

          {[7, 8, 9].map(n => <Btn key={n} onClick={() => num(String(n))}>{n}</Btn>)}
          <Btn red onClick={() => operate("*")}>×</Btn>

          {[4, 5, 6].map(n => <Btn key={n} onClick={() => num(String(n))}>{n}</Btn>)}
          <Btn red onClick={() => operate("-")}>−</Btn>

          {[1, 2, 3].map(n => <Btn key={n} onClick={() => num(String(n))}>{n}</Btn>)}
          <Btn red onClick={() => operate("+")}>+</Btn>

          <Btn className="col-span-2" onClick={() => num("0")}>0</Btn>
          <Btn onClick={dot}>.</Btn>
          <Btn red onClick={equals}>=</Btn>
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