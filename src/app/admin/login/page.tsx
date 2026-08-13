"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PiInfinity, PiSpinner, PiWarningCircle } from "react-icons/pi";
import { http, setToken } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await http.post<{ token: string; user: { role: string } }>(
        "/auth/login",
        { email, password },
        { auth: false }
      );
      setToken(res.token);
      router.push("/admin");
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("401")
          ? "Invalid email or password"
          : "Something went wrong, please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-ink-900 font-sans">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-ink-900 text-white flex items-center justify-center">
            <PiInfinity className="text-2xl" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight">JosephLab</h1>
            <p className="text-xs text-ink-500 -mt-0.5">Admin Console</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-200 p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
          <p className="text-[13px] text-ink-500 mt-1">Sign in to manage your portfolio.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-[12.5px] font-medium text-ink-600 block mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@josephlab.dev"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-ink-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 text-[14px] outline-none transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12.5px] font-medium text-ink-600">Password</label>
                <a href="#" className="text-[12px] text-sky-600 hover:text-sky-700 font-medium">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-ink-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 text-[14px] outline-none transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-coral/10 text-coral text-[13px]">
                <PiWarningCircle className="text-[16px] shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-ink-900 text-white text-[14px] font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && <PiSpinner className="animate-spin text-[16px]" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-ink-400 mt-6">
          Demo: admin@josephlab.dev / josephlab-secret
        </p>
      </div>
    </div>
  );
}
