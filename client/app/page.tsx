"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Search, Activity, ChevronRight, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Forensic<span className="text-emerald-400">Pro</span> Suite</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Features</Link>
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-medium text-black bg-emerald-400 hover:bg-emerald-500 rounded-md transition-colors"
            >
              Investigator Login
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center mt-20 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 mb-8"
          >
            <span className="flex w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Secure Digital Investigation Platform
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 max-w-4xl mb-6"
          >
            Advanced Forensics & <br /> Incident Response
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
          >
            A comprehensive suite for digital investigators. Analyze evidence, track threat actors, and generate chain-of-custody reports in a secure, isolated environment.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link 
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              Access Secure Portal
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#features"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-all"
            >
              Explore Features
            </Link>
          </motion.div>
        </main>

        {/* Features Preview */}
        <section id="features" className="py-24 px-8 border-t border-slate-800/50 mt-auto bg-slate-900/30">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search className="w-6 h-6 text-blue-400" />}
              title="Deep Analysis"
              description="Automated evidence parsing, malware scanning, and hash verification."
            />
            <FeatureCard 
              icon={<Terminal className="w-6 h-6 text-emerald-400" />}
              title="Forensic Terminal"
              description="Built-in secure terminal for advanced command-line investigation tools."
            />
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-purple-400" />}
              title="Threat Mapping"
              description="Geospatial visualization of IP addresses and threat actors globally."
            />
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-6 text-center text-sm text-slate-500 border-t border-slate-800/50">
          &copy; {new Date().getFullYear()} Forensic Pro Suite. Open Source GSSoC Project.
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center mb-4 border border-slate-700/50">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
