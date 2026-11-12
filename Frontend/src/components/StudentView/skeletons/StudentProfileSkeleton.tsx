import React from "react";
import { SkeletonBlock, SkeletonCard, SkeletonBadge } from "./SkeletonPrimitives";

/**
 * Skeleton matching the layout of StudentProfile to prevent CLS.
 */
export function StudentProfileSkeleton() {
  return (
    <div className="w-full space-y-6 select-none" aria-busy="true" aria-label="Đang tải hồ sơ sinh viên">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-7 w-48 rounded-lg" />
          <SkeletonBlock className="h-4 w-64 rounded-md" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-full" />
      </div>

      {/* Main Grid: Left sidebar + Right content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card: Avatar & Student Basic Info */}
        <SkeletonCard className="space-y-6 p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <SkeletonBlock className="h-24 w-24 rounded-full" />
            <SkeletonBlock className="h-5 w-40 rounded-md" />
            <SkeletonBadge className="h-6 w-24" />
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-5 text-left">
            <SkeletonBlock className="h-3.5 w-full rounded-md" />
            <SkeletonBlock className="h-3.5 w-4/5 rounded-md" />
            <SkeletonBlock className="h-3.5 w-5/6 rounded-md" />
            <SkeletonBlock className="h-3.5 w-3/4 rounded-md" />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </SkeletonCard>

        {/* Right Area: Form sections (Skills, CV, Projects) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 1: Professional Summary / Bio */}
          <SkeletonCard className="space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <SkeletonBlock className="h-5 w-44 rounded-md" />
              <SkeletonBlock className="h-4 w-16 rounded-md" />
            </div>
            <div className="space-y-2 pt-1">
              <SkeletonBlock className="h-3.5 w-full rounded-md" />
              <SkeletonBlock className="h-3.5 w-11/12 rounded-md" />
              <SkeletonBlock className="h-3.5 w-4/5 rounded-md" />
            </div>
          </SkeletonCard>

          {/* Section 2: Skills */}
          <SkeletonCard className="space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <SkeletonBlock className="h-5 w-36 rounded-md" />
              <SkeletonBlock className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <SkeletonBadge className="h-7 w-20" />
              <SkeletonBadge className="h-7 w-24" />
              <SkeletonBadge className="h-7 w-16" />
              <SkeletonBadge className="h-7 w-28" />
              <SkeletonBadge className="h-7 w-20" />
              <SkeletonBadge className="h-7 w-24" />
            </div>
          </SkeletonCard>

          {/* Section 3: CV File */}
          <SkeletonCard className="space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <SkeletonBlock className="h-5 w-32 rounded-md" />
              <SkeletonBlock className="h-8 w-28 rounded-lg" />
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <SkeletonBlock className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-48 rounded-md" />
                <SkeletonBlock className="h-3 w-28 rounded-md" />
              </div>
              <SkeletonBlock className="h-8 w-20 rounded-lg" />
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
