"use client";

import React from "react";
import { Calendar, User, Clock, DollarSign, MapPin, FileQuestion, ShieldAlert } from "lucide-react";

export type TaskType =
  | "registration"
  | "tender_document_purchase"
  | "pre_bid_attendance"
  | "site_visit"
  | "clarification_submission"
  | "bid_security"
  | "physical_delivery"
  | "other";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface TaskCardData {
  id: string;
  title: string;
  taskType: TaskType;
  status: TaskStatus;
  assigneeName?: string;
  dueAt?: string;
  notes?: string;
}

interface TaskCardProps {
  task?: TaskCardData;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  onStatusChange?: (newStatus: TaskStatus) => void;
  className?: string;
}

export function TaskCard({
  task,
  isLoading = false,
  isEmpty = false,
  isError = false,
  
  className = "",
}: TaskCardProps) {
  if (isLoading) {
    return (
      <div className={`p-3 bg-white border border-slate-200 rounded-lg animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-1/3"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 ${className}`}>
        Failed to load bid task.
      </div>
    );
  }

  if (isEmpty || !task) {
    return (
      <div className={`p-4 bg-white border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 ${className}`}>
        No active tasks scheduled.
      </div>
    );
  }

  const typeIcons = {
    registration: User,
    tender_document_purchase: DollarSign,
    pre_bid_attendance: Clock,
    site_visit: MapPin,
    clarification_submission: FileQuestion,
    bid_security: ShieldAlert,
    physical_delivery: Calendar,
    other: Clock,
  }[task.taskType] || Clock;

  const TypeIcon = typeIcons;

  const statusStyles = {
    todo: "bg-slate-100 text-slate-700 border-slate-200",
    in_progress: "bg-blue-50 text-blue-800 border-blue-200",
    blocked: "bg-red-50 text-red-800 border-red-200",
    done: "bg-emerald-50 text-emerald-800 border-emerald-200",
  }[task.status];

  return (
    <div className={`p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-all ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <TypeIcon className="w-3.5 h-3.5 text-blue-600" />
          <span className="capitalize">{task.taskType.replace(/_/g, " ")}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusStyles}`}>
          {task.status.replace(/_/g, " ")}
        </span>
      </div>

      <h4 className="text-xs font-bold text-slate-900 leading-snug mb-2.5">
        {task.title}
      </h4>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1 font-medium">
          <User className="w-3 h-3 text-slate-400" />
          <span>{task.assigneeName || "Unassigned"}</span>
        </span>
        {task.dueAt && (
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Due {task.dueAt}</span>
          </span>
        )}
      </div>
    </div>
  );
}
