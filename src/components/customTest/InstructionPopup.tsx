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
    if (!confirmed || loadingStep) return;
    onStartTest();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-3 backdrop-blur-[1px] sm:p-5">
      <div
        className="
          relative flex w-full max-w-xl flex-col
          overflow-hidden rounded-3xl bg-white
          max-h-[90vh]
        "
      >
        {/* Header */}
        <div className="relative bg-orange-50/50 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Custom Test Instructions
                </h2>

                <p className="text-xs text-gray-500 sm:text-sm">
                  Please read these instructions before starting
                </p>
              </div>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="
                flex h-10 w-10 shrink-0 items-center justify-center
                rounded-full border border-gray-200
                bg-white text-gray-500
                transition-all duration-200
                hover:border-orange-200
                hover:bg-orange-50
                hover:text-orange-500
              "
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 sm:px-6">
          {/* Section Title */}
          <div className="mb-2 flex items-center gap-2">

            <h3 className="text-sm font-bold text-gray-900">
              Before You Start
            </h3>
          </div>

          {/* Instructions */}
          <div className="">
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

          {/* Rules */}
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />

              <h3 className="text-sm font-bold text-gray-900">
                Important Rules
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <RuleCard
                emoji="1️⃣"
                title="One Attempt"
                description="Only one attempt"
              />

              <RuleCard
                emoji="🚫"
                title="No Re-entry"
                description="Cannot restart"
              />

              <RuleCard
                emoji="🎯"
                title="Stay Focused"
                description="Don't leave test"
              />

              <RuleCard
                emoji="✓"
                title="Complete Test"
                description="Submit when done"
              />
            </div>
          </div>

          {/* Confirmation */}
          <label
            className={`
              mt-5 flex cursor-pointer items-center gap-3
              transition-all duration-200
         
            `}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="
                h-4 w-4 shrink-0 cursor-pointer
                accent-orange-500
              "
            />

            <span className="text-xs leading-5 text-gray-600 sm:text-sm">
              I have read and understood the instructions.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex gap-2.5">
            {/* Cancel */}
            <button
              type="button"
              onClick={onClose}
              disabled={!!loadingStep}
              className="
                flex-1 rounded-xl
                border border-gray-200
                bg-white px-4 py-2.5
                text-sm font-semibold text-gray-600
                transition-all duration-200
                hover:border-gray-300
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            {/* Start */}
            <button
              type="button"
              onClick={handleStart}
              disabled={!confirmed || !!loadingStep}
              className={`
                flex-1 rounded-xl
                px-4 py-2.5
                text-sm font-semibold
                transition-all duration-200

                ${
                  confirmed && !loadingStep
                    ? `
                      bg-orange-500 text-white
                      shadow-sm shadow-orange-200
                      hover:bg-orange-600
                      hover:shadow-md hover:shadow-orange-200
                    `
                    : `
                      cursor-not-allowed
                      bg-gray-100 text-gray-400
                    `
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

/* -------------------------------------------------------
   Instruction Row
------------------------------------------------------- */

function Instruction({ icon, text }) {
  return (
    <div
      className="
        flex items-center gap-3
        rounded-lg px-2.5 py-1
        transition-colors duration-150
        hover:bg-orange-50
      "
    >
      <div
        className="
          flex shrink-0 items-center justify-center
          text-orange-500
        "
      >
        {icon}
      </div>

      <p className="text-xs font-medium leading-5 text-gray-600 sm:text-sm">
        {text}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   Rule Card
------------------------------------------------------- */

function RuleCard({ emoji, title, description }) {
  return (
    <div
      className="
        rounded-xl border border-gray-100
        bg-gray-50/70 px-3 py-3
        transition-all duration-200
        hover:border-orange-100
        hover:bg-orange-50/40
      "
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{emoji}</span>

        <p className="text-xs font-semibold text-gray-800 sm:text-sm">
          {title}
        </p>
      </div>

      <p className="mt-1 pl-6 text-[11px] text-gray-500 sm:text-xs">
        {description}
      </p>
    </div>
  );
}