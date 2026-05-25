"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Terminal, AlertCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const router = useRouter();

  const emailError =
    touched.email &&
    email.length > 0 &&
    !validateEmail(email);

  const passwordError =
    touched.password &&
    password.length > 0 &&
    password.length < 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
      } else if (result?.error) {
        setError(
          "Invalid credentials. Please check your email and password."
        );
      } else {
        setError(
          "Authentication service unavailable. Please try again."
        );
      }
    } catch {
      setError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
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

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Forensic Pro Suite
          </h1>

          <p className="text-slate-500 text-[10px] mt-1 font-mono uppercase tracking-[0.2em]">
            Secure Investigator Portal
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" />
              Email Address
            </label>

            <input
              type="email"
              className={`w-full bg-white dark:bg-slate-950 border rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none transition-all font-mono shadow-sm ${
                emailError
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-slate-200 dark:border-slate-800 focus:border-emerald-500/50"
              }`}
              placeholder="agent@forensics.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() =>
                setTouched((prev) => ({
                  ...prev,
                  email: true,
                }))
              }
              aria-invalid={emailError}
              aria-describedby={
                emailError ? "email-error" : undefined
              }
              required
            />

            {emailError && (
              <p
                id="email-error"
                className="text-red-400 text-[10px] font-mono"
                role="alert"
              >
                Please enter a valid email address.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full bg-white dark:bg-slate-950 border rounded-xl p-3 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none transition-all font-mono shadow-sm ${
                  passwordError
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-slate-200 dark:border-slate-800 focus:border-emerald-500/50"
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    password: true,
                  }))
                }
                aria-invalid={passwordError}
                aria-describedby={
                  passwordError
                    ? "password-error"
                    : undefined
                }
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {passwordError && (
              <p
                id="password-error"
                className="text-red-400 text-[10px] font-mono"
                role="alert"
              >
                Password must be at least 6 characters.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-900/20 uppercase text-xs tracking-widest mt-4 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              "Access Terminal"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-5">
          Don&apos;t have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-emerald-500 cursor-pointer hover:underline"
          >
            Create Account
          </span>
        </p>
      </motion.div>
    </div>
  );
}