import React from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.div
            className="
              relative
              w-full
              max-w-[560px]
              overflow-hidden
              rounded-[20px]
              bg-white
              shadow-[0_15px_45px_rgba(0,0,0,0.18)]
            "
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: 20,
            }}
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Illustration */}
            <div
              className="
                relative
                flex
                h-[145px]
                items-center
                justify-center
                overflow-hidden
              "
              style={{ backgroundColor: "#ff6942" }}
            >
              {/* Illustration */}
              <motion.img
                src="/images/confirm.png"
                alt="Confirmation"
                className="
                  relative
                  z-10
                  h-[145px]
                  w-auto
                  object-contain
                "
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.05,
                  ease: "easeOut",
                }}
              />

              {/* Close Button */}
              <motion.button
                type="button"
                onClick={onClose}
                aria-label="Close confirmation"
                className="
                  absolute
                  right-3
                  top-3
                  z-20
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-[#ff6942]
                  shadow-sm
                "
                whileHover={{
                  scale: 1.08,
                }}
                whileTap={{
                  scale: 0.92,
                }}
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 pt-5 text-center sm:px-7">
              {/* Heading */}
              <motion.h2
                className="
                text-base
                  lg:text-lg
                  font-bold
                  leading-tight
                  tracking-[-0.3px]
                  text-[#2f2f2f]
                "
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: 0.1,
                }}
              >
                Ready to Start Your Test?
              </motion.h2>

              {/* Description */}
              <motion.p
                className="
                  mx-auto
                  mt-2
                  max-w-[380px]
                  lg:text-base
                  text-sm
                  leading-[1.5]
                  text-gray-500
                "
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: 0.15,
                }}
              >
                Are you sure you want to start the test?
                <br className="hidden sm:block" />
                Once you begin, the timer will start and your attempt will be
                recorded.
              </motion.p>

              {/* Buttons */}
              <motion.div
                className="mt-10 py-5 flex justify-center items-center gap-8 w-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: 0.2,
                }}
              >
                {/* Confirm */}
                <motion.button
                  type="button"
                  onClick={onConfirm}
                  className="
                    h-[48px]
                    rounded-lg
                    px-10
                    text-xs
                    lg:text-base
                    font-semibold
                    text-white
                  "
                  style={{ backgroundColor: "#ff6942" }}
                  whileHover={{
                    y: -1,
                    boxShadow: "0 6px 15px rgba(255, 105, 66, 0.25)",
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                >
                  Yes, Start Test
                </motion.button>

                {/* Cancel */}
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="
                    h-[48px]
                    rounded-lg
                    border
                    px-10
                    text-xs
                    lg:text-base
                    font-semibold
                  "
                  style={{
                    color: "#ff6942",
                    backgroundColor: "#fff7f4",
                    borderColor: "#ffe0d7",
                  }}
                  whileHover={{
                    y: -1,
                    backgroundColor: "#fff3ef",
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                >
                  Let Me Rethink
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationPopup;