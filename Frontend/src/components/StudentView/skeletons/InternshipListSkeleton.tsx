import React from "react";
import { SkeletonBlock, SkeletonCard, SkeletonBadge } from "./SkeletonPrimitives";

/**
 * Skeleton matching the exact layout of InternshipList to prevent CLS.
 */
export function InternshipListSkeleton() {
  return (
    <div className="w-full space-y-8 select-none" aria-busy="true" aria-label="Đang tải danh sách việc làm">
      {/* Search & Filter Bar Skeleton */}
      <div className="mx-auto max-w-4xl rounded-2xl border border-teal-900/10 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SkeletonBlock className="h-11 flex-1 rounded-xl" />
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-11 w-32 rounded-xl" />
            <SkeletonBlock className="h-11 w-24 rounded-xl" />
          </div>
        </div>
        {/* Filter Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <SkeletonBadge className="h-7 w-20" />
          <SkeletonBadge className="h-7 w-24" />
          <SkeletonBadge className="h-7 w-28" />
          <SkeletonBadge className="h-7 w-20" />
          <SkeletonBadge className="h-7 w-32" />
        </div>
      </div>

      {/* Grid of Job Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} className="space-y-4 p-5 sm:p-6">
            {/* Header: Company logo + Company info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-14 w-14 shrink-0 rounded-2xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-3.5 w-28 rounded-md" />
                  <SkeletonBlock className="h-4 w-40 rounded-md" />
                </div>
              </div>
              <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
            </div>

            {/* Job Title */}
            <div className="pt-1">
              <SkeletonBlock className="h-5 w-4/5 rounded-md" />
            </div>

            {/* Quick Specs: Salary & Location */}
            <div className="grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-12 rounded-xl" />
              <SkeletonBlock className="h-12 rounded-xl" />
            </div>

            {/* Description lines */}
            <div className="space-y-1.5 pt-1">
              <SkeletonBlock className="h-3 w-full rounded-md" />
              <SkeletonBlock className="h-3 w-4/5 rounded-md" />
            </div>

            {/* Skill tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <SkeletonBadge className="h-6 w-16" />
              <SkeletonBadge className="h-6 w-20" />
              <SkeletonBadge className="h-6 w-14" />
            </div>

            {/* Footer: Deadline & Action button */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <SkeletonBlock className="h-3.5 w-24 rounded-md" />
              <SkeletonBlock className="h-9 w-24 rounded-xl" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
