/**
 * @license
 * All Rights Reserved.
 */

import { useEffect, useRef } from "react";
import { formatLargeNumber } from "../utils/format";

/**
 * Displays a money value that smoothly counts up toward the target using
 * requestAnimationFrame + direct DOM writes — no React re-renders at 60 fps.
 */
export default function SmoothMoneyCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef(value);
  const targetRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    targetRef.current = value;
  }, [value]);

  useEffect(() => {
    const tick = () => {
      const diff = targetRef.current - currentRef.current;
      if (Math.abs(diff) > 0.001) {
        // Lerp faster when far away, slow as it approaches target.
        currentRef.current += diff * 0.14;
        if (spanRef.current) {
          spanRef.current.textContent = formatLargeNumber(currentRef.current);
        }
      } else if (currentRef.current !== targetRef.current) {
        currentRef.current = targetRef.current;
        if (spanRef.current) {
          spanRef.current.textContent = formatLargeNumber(targetRef.current);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <span ref={spanRef} className={className}>
      {formatLargeNumber(value)}
    </span>
  );
}
