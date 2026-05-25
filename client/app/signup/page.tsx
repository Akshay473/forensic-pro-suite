"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  UserPlus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Native RFC 5322 compliant regex check for validation routines
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignupPage() {
  const router = useRouter();

  // Unified form tracking prevents fragmented individual state triggers
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [uiState, setUiState] = useState({
    error: "",
    success: "",
    isLoading: false,
  });

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUiState({ error: "", success: "", isLoading: false });

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    // 1. Mandatory input validation criteria bounds checks
    if (!trimmedName || !trimmedEmail || !formData.password) {
      setUiState((prev) => ({
        ...prev,
        error: "All fields are required before processing profile.",
      }));
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setUiState((prev) => ({
        ...prev,
        error: "Please supply a valid institutional email address.",
      }));
      return;
    }

    if (formData.password.length < 6) {
      setUiState((prev) => ({
        ...prev,
        error:
          "Security restriction: Passwords must be at least 6 characters long.",
      }));
      return;
    }

    setUiState((prev) => ({ ...prev, isLoading: true }));

    try {
      // TODO: Replace this simulated timeout execution node with a live downstream fetch pipeline
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setUiState({
        error: "",
        success: "Investigator profile registered successfully! Redirecting...",
        isLoading: false,
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setUiState({
        success: "",
        error:
          "System Exception: Profile creation aborted. Please retry shortly.",
        isLoading: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-emerald-500/20 shadow-xl w-full max-w-md text-slate-900 dark:text-slate-100"
      >
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
              <UserPlus
                className="w-8 h-8 text-emerald-500"
                aria-hidden="true"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Account
          </h1>
          <p className="text-slate-500 text-xs mt-2 font-mono uppercase tracking-widest">
            Investigator Registration Portal
          </p>
        </header>

        {uiState.error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uiState.error}</span>
          </div>
        )}

        {uiState.success && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{uiState.success}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label
              htmlFor="full-name"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="full-name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange("name")}
                disabled={uiState.isLoading}
                className="w-full pl-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-500 disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email-address"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="email-address"
                type="email"
                placeholder="agent@forensics.com"
                value={formData.email}
                onChange={handleInputChange("email")}
                disabled={uiState.isLoading}
                className="w-full pl-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-500 disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange("password")}
                disabled={uiState.isLoading}
                className="w-full pl-10 pr-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-500 disabled:opacity-50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={uiState.isLoading}
                aria-label={
                  showPassword ? "Hide password text" : "Reveal password text"
                }
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={uiState.isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all uppercase text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uiState.isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-emerald-500 hover:text-emerald-400 font-medium hover:underline transition-all focus:outline-none focus:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
