import React, { useEffect, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { skillsApi } from "../../skills/api";

export interface SkillOption {
  id: string;
  name: string;
}

interface SkillPickerProps {
  selected: SkillOption[];
  onChange: (skills: SkillOption[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export const SkillPicker: React.FC<SkillPickerProps> = ({
  selected,
  onChange,
  multiple = false,
  placeholder = "Tìm kỹ năng...",
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SkillOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const page = await skillsApi.list({
          page: 1,
          limit: 20,
          search: query.trim() || undefined,
        });
        if (active) {
          setOptions(page.items.map(({ id, name }) => ({ id, name })));
        }
      } catch {
        if (active) setLoadError("Không thể tải danh sách kỹ năng.");
      } finally {
        if (active) setIsLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, query, reloadKey]);

  const isSelected = (skill: SkillOption) =>
    selected.some((item) => item.id === skill.id);

  const toggle = (skill: SkillOption) => {
    if (multiple) {
      onChange(
        isSelected(skill)
          ? selected.filter((item) => item.id !== skill.id)
          : [...selected, skill],
      );
      return;
    }
    onChange([skill]);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2 py-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
        {selected.map((skill) => (
          <span
            key={skill.id}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700"
          >
            {skill.name}
            <button
              type="button"
              onClick={() => onChange(selected.filter((item) => item.id !== skill.id))}
              className="rounded p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700"
              aria-label={`Bỏ kỹ năng ${skill.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Search className="ml-1 h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          placeholder={selected.length && !multiple ? "Đổi kỹ năng..." : placeholder}
          className="min-w-32 flex-1 bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          aria-label={placeholder}
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {isLoading ? (
            <p className="px-3 py-2 text-xs text-slate-500">Đang tìm kỹ năng...</p>
          ) : loadError ? (
            <div className="px-3 py-2 text-xs text-rose-700"><p>{loadError}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-2 font-bold text-indigo-700 hover:text-indigo-900">Thử lại</button></div>
          ) : options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">Không có kỹ năng phù hợp.</p>
          ) : (
            options.map((skill) => {
              const selectedOption = isSelected(skill);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggle(skill)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selectedOption ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {skill.name}
                  {selectedOption && <Check className="h-4 w-4" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};