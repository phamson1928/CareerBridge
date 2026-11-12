import React from "react";

interface SkeletonBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Atomic skeleton building block with GPU-accelerated shimmer effect.
 * Uses neutral slate/teal tint that matches the Student Aurora Bento design.
 */
export function SkeletonBlock({ className = "", style }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`skeleton-shimmer rounded-xl select-none pointer-events-none ${className}`}
    />
  );
}

interface SkeletonCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Bento container card wrapper for skeletons, maintaining true layout dimensions.
 */
export function SkeletonCard({ children, className = "" }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-teal-900/10 bg-white/85 p-5 shadow-xs backdrop-blur-xs select-none pointer-events-none ${className}`}
    >
      {children}
    </div>
  );
}

interface SkeletonTextProps {
  className?: string;
  lines?: number;
}

/**
 * Text line skeleton placeholder.
 */
export function SkeletonText({ className = "h-4 w-full", lines = 1 }: SkeletonTextProps) {
  if (lines <= 1) {
    return <SkeletonBlock className={`h-4 rounded-md ${className}`} />;
  }

  return (
    <div className="space-y-2 select-none pointer-events-none" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={index}
          className={`h-4 rounded-md ${
            index === lines - 1 ? "w-2/3" : "w-full"
          } ${className}`}
        />
      ))}
    </div>
  );
}

interface SkeletonBadgeProps {
  className?: string;
}

/**
 * Pill badge skeleton placeholder.
 */
export function SkeletonBadge({ className = "h-6 w-16" }: SkeletonBadgeProps) {
  return <SkeletonBlock className={`rounded-full ${className}`} />;
}
