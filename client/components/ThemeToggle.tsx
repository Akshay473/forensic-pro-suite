"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() =>
        setTheme(currentTheme === "dark" ? "light" : "dark")
      }
      className="p-2.5 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-all cursor-pointer"
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      role="switch"
      aria-checked={currentTheme === "dark"}
    >
      {currentTheme === "dark" ? (
        <Sun className="w-5 h-5 transition-all" />
      ) : (
        <Moon className="w-5 h-5 transition-all" />
      )}
    </motion.button>
  );
}