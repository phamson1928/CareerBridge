import React from "react";
import { SkeletonBlock, SkeletonCard, SkeletonBadge } from "./SkeletonPrimitives";

/**
 * Skeleton matching the layout of StudentApplications to prevent CLS.
 */
export function ApplicationsSkeleton() {
  return (
    <div className="w-full space-y-6 select-none" aria-busy="true" aria-label="Đang tải danh sách đơn ứng tuyển">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-7 w-52 rounded-lg" />
          <SkeletonBlock className="h-4 w-72 rounded-md" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>

      {/* Metrics Row (3 Bento Counters) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} className="flex items-center gap-4 p-4">
            <SkeletonBlock className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-20 rounded-md" />
              <SkeletonBlock className="h-6 w-12 rounded-md" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Application Cards List */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <SkeletonBlock className="h-12 w-12 shrink-0 rounded-2xl" />
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-5 w-48 rounded-md" />
                  <SkeletonBlock className="h-3.5 w-32 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBadge className="h-7 w-28" />
                <SkeletonBlock className="h-9 w-9 rounded-xl" />
              </div>
            </div>

            {/* Application Details Preview */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
              <SkeletonBlock className="h-3.5 w-36 rounded-md" />
              <SkeletonBlock className="h-3 w-full rounded-md" />
              <SkeletonBlock className="h-3 w-3/4 rounded-md" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <SkeletonBlock className="h-3 w-32 rounded-md" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-8 w-20 rounded-lg" />
                <SkeletonBlock className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
