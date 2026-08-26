import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Lock,
  X,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function ResourceLink({ locked, slug, link } : any) {
  const [showPopup, setShowPopup] = useState(false);
  const router = useNavigate()

  const handleClick = (e) => {
    if (locked) {
      e.preventDefault();
      setShowPopup(true);
    }
  };

  return (
    <>
      {/* Resource Button */}
      {locked ? (
        <button
          type="button"
          onClick={handleClick}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full
            bg-gray-100 text-gray-400 transition-all duration-200
            hover:bg-orange-50 hover:text-orange-500
            dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-orange-900/20"
          title="Content locked"
        >
          <Lock className="h-4 w-4" />
        </button>
      ) : (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full
            bg-gray-100 text-gray-500 transition-all duration-200
            hover:bg-orange-500 hover:text-white
            dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-orange-500"
          title="Open resource"
        >
          <ArrowRight className="h-4 w-4" />
        </a>
      )}

      {/* Locked Modal */}
      {showPopup &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          >
            {/* Modal */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-2xl
                border border-orange-100 bg-white shadow-2xl
                dark:border-gray-700 dark:bg-gray-900"
            >
              {/* Top Accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-orange-500" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center
                  rounded-full text-gray-400 transition-colors
                  hover:bg-gray-100 hover:text-gray-700
                  dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="px-6 pb-6 pt-7">
                {/* Lock Icon */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-900/20">
                  <Lock className="h-6 w-6 text-orange-500" />
                </div>

                {/* Heading */}
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Content Locked
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    This resource is currently locked. Upgrade your account
                    or complete your profile to get access to this content.
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPopup(false)}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5
                      text-sm font-semibold text-gray-600 transition-colors
                      hover:bg-gray-50
                      dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPopup(false);

                      // Add your redirect here
                      router(`/course/${slug}`);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl
                      bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white
                      shadow-sm transition-all
                      hover:bg-orange-600 hover:shadow-md"
                  >
                    Unlock Now
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}