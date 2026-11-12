import React from "react";
import { SkeletonBlock, SkeletonCard, SkeletonBadge } from "./SkeletonPrimitives";

/**
 * Skeleton matching the layout of StudentReports to prevent CLS.
 */
export function ReportsSkeleton() {
  return (
    <div className="w-full space-y-6 select-none" aria-busy="true" aria-label="Đang tải danh sách báo cáo thực tập">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-7 w-56 rounded-lg" />
          <SkeletonBlock className="h-4 w-72 rounded-md" />
        </div>
        <SkeletonBlock className="h-10 w-44 rounded-full" />
      </div>

      {/* Progress Metric Box */}
      <div className="rounded-2xl border border-teal-900/10 bg-white/90 p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-36 rounded-md" />
            <SkeletonBlock className="h-5 w-48 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBadge className="h-7 w-28" />
            <SkeletonBadge className="h-7 w-24" />
          </div>
        </div>
      </div>

      {/* Weekly Reports Table / List Placeholder */}
      <SkeletonCard className="p-0 overflow-hidden">
        {/* Table Header Placeholder */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <SkeletonBlock className="h-4 w-28 rounded-md" />
          <SkeletonBlock className="h-4 w-24 rounded-md" />
          <SkeletonBlock className="h-4 w-32 rounded-md hidden sm:block" />
          <SkeletonBlock className="h-4 w-20 rounded-md" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 p-2 sm:p-0">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-4 w-40 rounded-md" />
                  <SkeletonBlock className="h-3 w-28 rounded-md" />
                </div>
              </div>
              <SkeletonBlock className="h-3.5 w-36 rounded-md hidden md:block" />
              <div className="flex items-center gap-3">
                <SkeletonBadge className="h-6 w-24" />
                <SkeletonBlock className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
