"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";

export default function CustomTestInstructionPopup({
  isOpen,
  onClose,
  onStartTest,
  loadingStep,
}) {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleStart = () => {
    if (!confirmed) return;
    onStartTest();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 p-3 backdrop-blur-xs sm:p-5">
      <div
        className="
          relative flex w-full max-w-[600px] flex-col
          overflow-hidden rounded-2xl bg-white shadow-2xl
          max-h-[90vh]
        "
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#f36d45] to-[#e85d35] px-5 py-4 flex justify-between items-center">
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <FileText size={20} className="text-white" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">
                Custom Test Instructions
              </h2>

              <p className="text-[11px] text-white/80 sm:text-sm">
                Please read before starting
              </p>
            </div>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            className="
              
              flex h-7 w-7 items-center justify-center
              rounded-full bg-white/15 text-white
              transition hover:bg-white/25
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          {/* Instructions */}
          <div>
            <h3 className="mb-2.5 text-sm font-bold text-gray-900 sm:text-sm">
              Before You Start
            </h3>

            <div className="space-y-1">
              <Instruction
                icon={<CheckCircle2 size={15} />}
                text="Make sure you have a stable internet connection."
              />

              <Instruction
                icon={<Clock3 size={15} />}
                text="Make sure you have enough uninterrupted time."
              />

              <Instruction
                icon={<ShieldAlert size={15} />}
                text="Do not close, refresh, or leave the test window."
              />

              <Instruction
                icon={<AlertTriangle size={15} />}
                text="Exiting the test may permanently end your attempt."
              />

              <Instruction
                icon={<FileText size={15} />}
                text="Submit the test only after completing all questions."
              />
            </div>
          </div>

          {/* Small Rules */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <RuleCard title="One Attempt" description="Only one attempt" />

            <RuleCard title="No Re-entry" description="Cannot restart" />

            <RuleCard title="Stay Focused" description="Don't leave test" />

            <RuleCard title="Complete Test" description="Submit when done" />
          </div>

          {/* Confirmation */}
          <label
            className="
              mt-4 flex cursor-pointer items-center justify-start gap-2.5
              rounded-xl border border-gray-200 bg-gray-50
              p-3 transition
              hover:border-[#f36d45]/40
              hover:bg-orange-50/40
            "
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="
                mt-0.5 h-4 w-4 shrink-0 cursor-pointer
                accent-[#f36d45]
              "
            />

            <span className="text-[11px] leading-4.5 text-gray-600 sm:text-sm">
              I have read and understood the instructions.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="
                flex-1 rounded-xl border border-gray-200
                px-4 py-2.5 text-sm font-semibold text-gray-600
                transition hover:bg-gray-50 sm:text-sm
              "
            >
              Cancel
            </button>

            <button
              onClick={onStartTest}
              disabled={!confirmed || !!loadingStep}
              className={`
    flex-1 rounded-xl px-4 py-2.5
    text-xs font-semibold text-white
    transition-all sm:text-sm
    ${
      confirmed && !loadingStep
        ? "cursor-pointer bg-[#f36d45] hover:bg-[#e85d35]"
        : "cursor-not-allowed bg-gray-300"
    }
  `}
            >
              {loadingStep === "creating" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  Creating Your Test...
                </span>
              ) : loadingStep === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  Loading Your Test...
                </span>
              ) : (
                "Start Test"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Compact Instruction */
function Instruction({ icon, text }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-orange-50">
      <div
        className="
          flex h-6 w-6 shrink-0 items-center justify-center
          rounded-md bg-orange-100 text-[#f36d45]
        "
      >
        {icon}
      </div>

      <p className="text-[11px] leading-4 text-gray-600 sm:text-sm">{text}</p>
    </div>
  );
}

/* Compact Rule */
function RuleCard({ title, description }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
      <p className="text-sm font-semibold text-gray-800">{title}</p>

      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
    </div>
  );
}
