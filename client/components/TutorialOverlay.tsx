"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  targetId?: string;
  active: boolean;
}

interface Rect { top: number; left: number; width: number; height: number; }

export default function TutorialOverlay({ targetId, active }: Props) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!active || !targetId) { setRect(null); return; }
    const el = document.getElementById(targetId);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [active, targetId]);

  if (!active) return null;

  const pad = 8;
  const clipPath = rect
    ? `polygon(0% 0%, 0% 100%, ${rect.left - pad}px 100%, ${rect.left - pad}px ${rect.top - pad}px, ${rect.left + rect.width + pad}px ${rect.top - pad}px, ${rect.left + rect.width + pad}px ${rect.top + rect.height + pad}px, ${rect.left - pad}px ${rect.top + rect.height + pad}px, ${rect.left - pad}px 100%, 100% 100%, 100% 0%)`
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-40 pointer-events-none"
      style={{ clipPath }}
    />
  );
}
