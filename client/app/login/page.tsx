"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
      } else {
        setErrorMsg("Invalid Credentials. Please check your email and password.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/20 rounded-3xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">General User Login</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Sign in to access your Forensic Pro Suite account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950/30"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950/30"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl font-mono text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-55"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Are you an investigator?{' '}
            <Link href="/investigator-login" className="font-semibold text-slate-900 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300">
              Access the Secure Portal here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
