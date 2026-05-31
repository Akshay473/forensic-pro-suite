"use client";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
      />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 sm:p-6 space-y-8 selection:bg-emerald-500/30 transition-colors duration-300">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-10 border-b border-slate-200 dark:border-slate-800 pb-8 gap-8">
        <div className="space-y-3 w-full md:w-auto">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-center md:justify-end">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-14 w-20" />
          <Skeleton className="h-14 w-32" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center shadow-sm">
            <Skeleton className="h-3 w-20 mx-auto mb-3" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
        ))}
      </div>

      {/* Main Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Tools grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl min-h-[120px] shadow-sm">
                <Skeleton className="h-6 w-6 mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Map skeleton */}
          <div className="bg-slate-50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        {/* Side Panel skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <DashboardSkeleton />
    </motion.div>
  );
}
