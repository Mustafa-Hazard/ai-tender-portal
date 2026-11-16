"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth, Role } from "../../context/AuthContext";

const PUBLIC_ROUTES = ["/login", "/signup"];

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, isPublicRoute, pathname, router]);

  // Public route can be viewed immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show clean spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-[#0051d5] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Verifying security credentials & organization workspace...
        </p>
      </div>
    );
  }

  // If not authenticated, keep showing loader while redirect happens
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-[#0051d5] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Redirecting to secure login...
        </p>
      </div>
    );
  }

  // Role-based route restrictions
  if (pathname.startsWith("/admin") && !user.is_platform_admin && user.role !== "owner_admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The <span className="font-semibold">Platform & Tenant Administration</span> workspace is
            restricted to users with the <span className="font-semibold text-red-700">Owner / Administrator</span> role.
            Your current assigned role is <span className="font-semibold capitalize">{user.role?.replace(/_/g, " ")}</span>.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
