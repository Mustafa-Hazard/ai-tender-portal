"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#0051d5] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
            TP
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Tender Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enterprise Bidder-Side SaaS & Intelligence Platform
          </p>
          <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            Sign In to Your Workspace
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 font-medium">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corporate Email Address
            </label>
            <div className="relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all outline-hidden"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#0051d5] hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/signup"
              className="font-bold text-[#0051d5] hover:underline"
            >
              Create an organization account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
