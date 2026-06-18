/**
 * @license
 * All Rights Reserved.
 */

import { useState } from "react";
import { motion } from "motion/react";
import type { GuideStep } from "./guides";

/**
 * Reusable step-by-step guide modal. Manages its own step index and calls
 * onClose when the player finishes (or skips) the last step. Used for both the
 * first-time tutorial and the per-feature unlock guides.
 */
export default function GuideModal({
  steps,
  onClose,
}: {
  steps: GuideStep[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const multiStep = steps.length > 1;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
      <motion.div
        key={step}
        initial={{ scale: 0.92, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-sm w-full glass-panel p-8 border-2 border-pink-500/30"
      >
        <div className="flex flex-col items-center text-justify gap-4 mb-6">
          {current.icon}
          <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-white text-center">
            {current.title}
          </h2>
          <p className="text-neutral-300 text-sm leading-relaxed">
            {current.body}
          </p>
        </div>

        {multiStep && (
          <div className="flex items-center gap-2 mb-5 justify-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? "bg-pink-400 w-4" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) onClose();
              else setStep((s) => s + 1);
            }}
            className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20 transition-all hover:opacity-90"
          >
            {isLast ? (multiStep ? "Let's Blend!" : "Got it!") : "Next"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
