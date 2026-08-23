"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
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
    <div className="flex min-h-screen w-full bg-slate-950 text-white">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.22),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_35%,_#111827_100%)] p-12 lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[140px]" />

        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-[0_0_30px_rgba(99,102,241,0.3)] ring-1 ring-white/10 backdrop-blur-sm">
            <img src="/issm-logo.png" alt="ISSM Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ISSM Smart</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35rem] text-indigo-200">Campus Portal</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-indigo-100">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Smart Campus Experience
          </div>
          <h2 className="mb-4 text-5xl font-extrabold leading-tight text-white">
            Future-ready <br />
            <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">
              student operations
            </span>
          </h2>
          <p className="max-w-lg text-xl font-medium text-slate-300">
            Attendance, mentoring, projects, analytics, and hiring support in one connected platform.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <ShieldCheck className="h-5 w-5 text-emerald-400" /> Enterprise-grade access control
          </div>
        </motion.div>
      </div>

      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2 xl:px-32">
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 p-1.5 shadow-sm ring-1 ring-slate-200">
              <img src="/issm-logo.png" alt="ISSM Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">ISSM Smart</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            {isSignUp ? "Create an Account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isSignUp ? "Set up your smart campus access in seconds." : "Sign in to continue to your dashboard."}
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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