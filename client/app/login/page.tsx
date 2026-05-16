"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, User, Terminal, BookOpen, Mail, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const router = useRouter();

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    let isValid = true;

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = "Email is required.";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
      isValid = false;
    }

    // Password Validation
    if (!password) {
      errors.password = "Password is required.";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard"); 
      } else {
        setError("Invalid Credentials. Use admin@forensics.com / password123");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-emerald-500/30 shadow-xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
                <Terminal className="w-8 h-8 text-emerald-500" />
             </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Forensic Pro Suite</h1>
          <p className="text-slate-500 text-[10px] mt-1 font-mono uppercase tracking-[0.2em]">Secure Investigator Portal</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl flex items-center gap-3 text-sm font-medium"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" /> Email Address
            </label>
            <input 
              type="email" 
              className={`w-full bg-white dark:bg-slate-950 border ${validationErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500/50'} rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none transition-all font-mono shadow-sm`}
              placeholder="agent@forensics.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) setValidationErrors({ ...validationErrors, email: undefined });
              }}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <p id="email-error" className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-3 h-3" /> Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className={`w-full bg-white dark:bg-slate-950 border ${validationErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500/50'} rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none transition-all font-mono shadow-sm pr-10`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) setValidationErrors({ ...validationErrors, password: undefined });
                }}
                aria-invalid={!!validationErrors.password}
                aria-describedby={validationErrors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationErrors.password && (
              <p id="password-error" className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
            )}
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-900/20 uppercase text-xs tracking-widest mt-4 active:scale-[0.98] flex items-center justify-center h-12"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access Terminal"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
          <Link href="/docs" className="flex items-center gap-2 hover:text-emerald-500 transition-colors">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="font-mono uppercase tracking-widest">Documentation</span>
          </Link>
          <a href="mailto:akshayshibu473@gmail.com" className="flex items-center gap-2 hover:text-emerald-500 transition-colors">
            <Mail className="w-3.5 h-3.5" />
            <span className="font-mono uppercase tracking-widest">Contact Support</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}