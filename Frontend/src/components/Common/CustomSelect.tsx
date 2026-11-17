import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  code?: string;
  badge?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  label?: string;
  required?: boolean;
  value: string;
  placeholder?: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyText?: string;
  searchable?: boolean;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  required = false,
  value,
  placeholder = "-- Chọn --",
  options,
  onChange,
  disabled = false,
  emptyText,
  searchable = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleDocumentClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && options.length > 5) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable, options.length]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value && opt.value !== ""),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.code && opt.code.toLowerCase().includes(q)),
    );
  }, [options, searchQuery]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-xs font-bold text-slate-800">
          {label}
          {required ? " *" : ""}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setSearchQuery("");
          }
        }}
        className={`w-full rounded-xl border p-2.5 text-sm flex items-center justify-between text-left transition cursor-pointer outline-none bg-white ${
          isOpen
            ? "border-teal-500 ring-2 ring-teal-500/20"
            : "border-slate-300 hover:border-slate-400"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <span className="truncate pr-2">
          {selectedOption ? (
            <span className="flex items-center gap-1.5 truncate">
              {selectedOption.code && (
                <span className="font-semibold text-teal-800 shrink-0">
                  [{selectedOption.code}]
                </span>
              )}
              <span className="font-medium text-slate-800 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="text-xs text-amber-600 shrink-0 font-normal">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-teal-600" : "text-slate-400"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-2xl border border-slate-200/90 !bg-white p-1.5 shadow-2xl shadow-slate-900/15 max-h-64 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150">
          {searchable && options.length > 5 && (
            <div className="sticky top-0 z-10 bg-white pb-1.5 mb-1 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full rounded-lg bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none border border-slate-200 focus:border-teal-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="py-3 text-center text-xs text-slate-400 font-medium">
              {emptyText ?? "Không tìm thấy lựa chọn phù hợp"}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-[#e0f4f6] text-[#02636a] font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  } ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {opt.code && (
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                          isSelected
                            ? "bg-teal-100/80 text-teal-800"
                            : "bg-slate-100 border border-slate-200 text-slate-600"
                        }`}
                      >
                        {opt.code}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="text-[10px] text-amber-600 font-normal shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-[#038b95] shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
