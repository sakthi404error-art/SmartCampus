"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { GraduationCap, Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Account created successfully! You can now sign in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Panel - High Contrast Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        {/* Cinematic Background Glow */}
        <div className="absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 h-3/4 w-3/4 rounded-full bg-blue-600/20 blur-[120px]"></div>

        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2 shadow-lg">
            <img src="/issm-logo.png" alt="ISSM Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ISSM Smart</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Campus Portal</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10"
        >
          <h2 className="mb-4 text-5xl font-extrabold leading-tight text-white">
            Welcome Future <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Business Leader
            </span>
          </h2>
          <p className="text-xl font-medium text-slate-300">
            Mr. Sakthi R P
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-slate-400">
            <ShieldCheck className="h-5 w-5 text-emerald-400" /> Enterprise-Grade Security
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2 xl:px-32">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Logo (Only shows on small screens) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-slate-200">
              <img src="/issm-logo.png" alt="ISSM Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">ISSM Smart</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            {isSignUp ? "Create an Account" : "Sign In"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to access the portal.
          </p>

          <form onSubmit={handleAuth} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>{isSignUp ? "Sign Up" : "Sign In"} <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="mt-6 w-full text-center text-sm font-medium text-slate-500 hover:text-indigo-600"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
        </div>
      </div>
    </div>
  );
}