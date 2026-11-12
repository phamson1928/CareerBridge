import React from "react";
import { SkeletonBlock, SkeletonCard, SkeletonBadge } from "./SkeletonPrimitives";

/**
 * Skeleton matching the layout of StudentEvaluations to prevent CLS.
 */
export function StudentEvaluationsSkeleton() {
  return (
    <div className="w-full space-y-6 select-none" aria-busy="true" aria-label="Đang tải kết quả đánh giá">
      {/* Header */}
      <div className="space-y-1.5 pt-2 pb-2">
        <SkeletonBlock className="h-7 w-60 rounded-lg" />
        <SkeletonBlock className="h-4 w-80 rounded-md" />
      </div>

      {/* 2 Evaluation Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Enterprise Evaluation */}
        <SkeletonCard className="space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-5 w-44 rounded-md" />
                <SkeletonBlock className="h-3.5 w-32 rounded-md" />
              </div>
            </div>
            <SkeletonBadge className="h-7 w-24" />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-4 w-32 rounded-md" />
              <SkeletonBlock className="h-6 w-16 rounded-md" />
            </div>
            <SkeletonBlock className="h-2.5 w-full rounded-full" />
          </div>

          <div className="space-y-2 pt-2">
            <SkeletonBlock className="h-3.5 w-full rounded-md" />
            <SkeletonBlock className="h-3.5 w-4/5 rounded-md" />
            <SkeletonBlock className="h-3.5 w-3/4 rounded-md" />
          </div>
        </SkeletonCard>

        {/* Lecturer Evaluation */}
        <SkeletonCard className="space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-5 w-44 rounded-md" />
                <SkeletonBlock className="h-3.5 w-32 rounded-md" />
              </div>
            </div>
            <SkeletonBadge className="h-7 w-24" />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-4 w-32 rounded-md" />
              <SkeletonBlock className="h-6 w-16 rounded-md" />
            </div>
            <SkeletonBlock className="h-2.5 w-full rounded-full" />
          </div>

          <div className="space-y-2 pt-2">
            <SkeletonBlock className="h-3.5 w-full rounded-md" />
            <SkeletonBlock className="h-3.5 w-4/5 rounded-md" />
            <SkeletonBlock className="h-3.5 w-3/4 rounded-md" />
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
