import React from "react";
import { SkeletonBlock, SkeletonCard, SkeletonBadge } from "./SkeletonPrimitives";

/**
 * Skeleton matching the layout of PlacementOverview to prevent CLS.
 */
export function PlacementSkeleton() {
  return (
    <div className="w-full space-y-6 select-none" aria-busy="true" aria-label="Đang tải thông tin thực tập">
      {/* Centered Typography Header */}
      <div className="mx-auto max-w-2xl text-center pt-2 pb-4 space-y-2">
        <SkeletonBlock className="h-8 sm:h-9 w-64 sm:w-80 mx-auto rounded-lg" />
        <SkeletonBlock className="h-4 w-72 sm:w-96 mx-auto rounded-md" />
      </div>

      {/* Hero Progress Banner */}
      <div className="rounded-3xl border border-teal-900/15 bg-white/90 p-6 sm:p-8 shadow-sm backdrop-blur-sm space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-56 rounded-md" />
              <SkeletonBlock className="h-4 w-40 rounded-md" />
            </div>
          </div>
          <SkeletonBadge className="h-8 w-32" />
        </div>

        {/* Progress Bar & Weeks info */}
        <div className="space-y-2 border-t border-slate-100 pt-5">
          <div className="flex justify-between">
            <SkeletonBlock className="h-3.5 w-32 rounded-md" />
            <SkeletonBlock className="h-3.5 w-20 rounded-md" />
          </div>
          <SkeletonBlock className="h-3 w-full rounded-full" />
        </div>
      </div>

      {/* Bento Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Company & Mentor Card */}
        <SkeletonCard className="space-y-4 p-6 sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
            <SkeletonBlock className="h-5 w-48 rounded-md" />
          </div>
          <div className="space-y-3 pt-2">
            <SkeletonBlock className="h-4 w-full rounded-md" />
            <SkeletonBlock className="h-4 w-3/4 rounded-md" />
            <SkeletonBlock className="h-4 w-5/6 rounded-md" />
          </div>
          <div className="pt-4 flex gap-3">
            <SkeletonBlock className="h-10 flex-1 rounded-xl" />
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
          </div>
        </SkeletonCard>

        {/* Teacher & Supervision Card */}
        <SkeletonCard className="space-y-4 p-6 sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
            <SkeletonBlock className="h-5 w-48 rounded-md" />
          </div>
          <div className="space-y-3 pt-2">
            <SkeletonBlock className="h-4 w-full rounded-md" />
            <SkeletonBlock className="h-4 w-4/5 rounded-md" />
            <SkeletonBlock className="h-4 w-2/3 rounded-md" />
          </div>
          <div className="pt-4 flex gap-3">
            <SkeletonBlock className="h-10 flex-1 rounded-xl" />
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
