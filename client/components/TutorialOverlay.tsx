"use client";
import { motion } from "framer-motion";

export default function TutorialOverlay({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 z-40 pointer-events-none"
      style={{ clipPath: 'polygon(0% 0%, 0% 100%, 10% 100%, 10% 10%, 90% 10%, 90% 90%, 10% 90%, 10% 100%, 100% 100%, 100% 0%)' }}
    >
      {/* This creates a "hole" in the dark overlay to highlight a specific tool */}
    </motion.div>
  );
}