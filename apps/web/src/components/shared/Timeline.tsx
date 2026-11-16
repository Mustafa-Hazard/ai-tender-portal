"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Calendar } from "lucide-react";

export interface TimelineMilestone {
  id: string;
  title: string;
  dateStr: string;
  timezone?: string;
  status: "completed" | "current" | "upcoming" | "overdue";
  description?: string;
}

interface TimelineProps {
  milestones?: TimelineMilestone[];
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  className?: string;
}

export function Timeline({
  milestones = [],
  isLoading = false,
  isEmpty = false,
  isError = false,
  className = "",
}: TimelineProps) {
  if (isLoading) {
    return (
      <div className={`p-4 bg-white border border-slate-200 rounded-lg animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-8 bg-slate-100 rounded"></div>
          <div className="h-8 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-4 bg-red-50 text-red-800 text-xs rounded border border-red-200 ${className}`}>
        Failed to render milestone progression timeline.
      </div>
    );
  }

  if (isEmpty || milestones.length === 0) {
    return (
      <div className={`p-6 bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500 ${className}`}>
        No schedule milestones configured.
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border border-slate-200 rounded-lg shadow-2xs ${className}`}>
      <h4 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
        <span>Tender & Submission Schedule Timeline</span>
      </h4>

      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {milestones.map((m) => {
          const statusIcon = {
            completed: <CheckCircle2 className="w-4 h-4 text-emerald-600 bg-white" />,
            current: <Clock className="w-4 h-4 text-blue-600 bg-white animate-pulse" />,
            upcoming: <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white ml-0.5" />,
            overdue: <AlertTriangle className="w-4 h-4 text-red-600 bg-white" />,
          }[m.status];

          return (
            <div key={m.id} className="relative">
              <div className="absolute -left-6 top-0.5 flex items-center justify-center">
                {statusIcon}
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <span className={`text-xs font-bold ${m.status === "current" ? "text-blue-900" : m.status === "overdue" ? "text-red-700" : "text-slate-800"}`}>
                  {m.title}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {m.dateStr} {m.timezone && `(${m.timezone})`}
                </span>
              </div>
              {m.description && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  {m.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
