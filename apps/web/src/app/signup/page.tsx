"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, User, Building, AlertCircle, ArrowRight, Loader2, Shield } from "lucide-react";
import { useAuth, Role } from "../../context/AuthContext";

export default function SignUpPage() {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState<Role>("owner_admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
        organization_name: orgName.trim() || undefined,
        role,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#0051d5] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
            TP
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Create Your Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Set up your organization workspace on AI Tender Portal
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 font-medium">{error}</div>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mustafa Khan"
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email <span className="text-red-500">*</span>
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
                  placeholder="mustafa@apex.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Organization Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Name
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Apex Technologies Ltd"
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Role
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white outline-hidden capitalize"
                >
                  <option value="owner_admin">Owner / Administrator</option>
                  <option value="bid_manager">Bid Manager</option>
                  <option value="compliance_reviewer">Compliance Reviewer</option>
                  <option value="technical_contributor">Technical Contributor</option>
                  <option value="finance_contributor">Finance Contributor</option>
                  <option value="approver">Executive Approver</option>
                  <option value="business_development">Business Development</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
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
                  placeholder="Min. 8 characters"
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#0051d5] hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account & Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-bold text-[#0051d5] hover:underline"
            >
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
