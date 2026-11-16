"use client";

import React, { useState } from "react";
import { DollarSign, Plus, Eye, EyeOff } from "lucide-react";

export interface PricingLineItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost?: number; // Restricted visibility
  sellingPrice: number;
  discountPercent?: number;
  taxRatePercent: number; // e.g. 18 for 18% GST
  totalNet: number;
  totalGross: number;
}

interface PricingTableShellProps {
  items?: PricingLineItem[];
  currency?: string;
  canViewMargins?: boolean;
  onAddItem?: () => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  className?: string;
}

export function PricingTableShell({
  items = [],
  currency = "PKR",
  canViewMargins = true,
  onAddItem,
  isLoading = false,
  isEmpty = false,
  isError = false,
  className = "",
}: PricingTableShellProps) {
  const [showCostMargin, setShowCostMargin] = useState(canViewMargins);

  if (isLoading) {
    return (
      <div className={`p-4 bg-white border border-slate-200 rounded-lg animate-pulse ${className}`}>
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-24 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-4 bg-red-50 text-red-800 text-xs rounded border border-red-200 ${className}`}>
        Failed to calculate commercial schedules.
      </div>
    );
  }

  if (isEmpty || items.length === 0) {
    return (
      <div className={`p-6 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500 ${className}`}>
        No pricing line items added yet. Click &quot;Add Line Item&quot; to begin building your commercial schedule.
      </div>
    );
  }

  // Deterministic decimal maths in code (Rule 8)
  const totalNet = items.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);
  const totalTax = items.reduce((sum, item) => sum + ((item.quantity * item.sellingPrice) * (item.taxRatePercent / 100)), 0);
  const totalGross = totalNet + totalTax;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden ${className}`}>
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Commercial Pricing Schedule & Tax Matrix</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">Deterministic Decimal Math (AGENTS.md Rule 8)</span>
        </div>

        <div className="flex items-center gap-3">
          {canViewMargins && (
            <button
              type="button"
              onClick={() => setShowCostMargin(!showCostMargin)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
            >
              {showCostMargin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showCostMargin ? "Hide Margins" : "Show Margins"}</span>
            </button>
          )}

          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white border border-slate-300 text-slate-800">
            {currency}
          </span>
        </div>
      </div>

      {/* Pricing Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th className="p-3">Item Code</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3">Unit</th>
              {showCostMargin && <th className="p-3 text-right">Unit Cost</th>}
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Tax Rate</th>
              <th className="p-3 text-right">Total Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">
                  No pricing line items added. Click &quot;Add Line Item&quot; to begin.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-700">{item.itemCode}</td>
                  <td className="p-3 text-slate-900 font-medium">{item.description}</td>
                  <td className="p-3 text-right font-mono">{item.quantity.toLocaleString()}</td>
                  <td className="p-3 text-slate-500">{item.unit}</td>
                  {showCostMargin && (
                    <td className="p-3 text-right font-mono text-slate-500">
                      {currency} {(item.unitCost || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </td>
                  )}
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {currency} {item.sellingPrice.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">{item.taxRatePercent}% GST</td>
                  <td className="p-3 text-right font-mono font-bold text-blue-900">
                    {currency} {(item.quantity * item.sellingPrice).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Summary Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onAddItem}
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span>Add Line Item</span>
        </button>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-500 mr-2">Net Subtotal:</span>
            <span className="font-mono font-bold text-slate-900">
              {currency} {totalNet.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 mr-2">Calculated Sales Tax:</span>
            <span className="font-mono font-bold text-amber-700">
              {currency} {totalTax.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded bg-blue-50 border border-blue-200">
            <span className="text-blue-950 font-bold mr-2">Gross Bid Total:</span>
            <span className="font-mono font-extrabold text-blue-900 text-sm">
              {currency} {totalGross.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
