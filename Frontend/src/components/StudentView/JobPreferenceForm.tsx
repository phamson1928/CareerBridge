import { ModalPortal } from "../ModalPortal";
import { Plus, X } from "lucide-react";
import { useState, useRef } from "react";
import type { JobPreferences } from "../../recommendations/types";

type PreferenceInput = Pick<
  JobPreferences,
  "desiredRoles" | "preferredLocations" | "preferredWorkTypes"
>;

interface JobPreferenceFormProps {
  initialValue: JobPreferences;
  isSaving: boolean;
  onClose: () => void;
  onSave: (value: PreferenceInput) => Promise<void>;
}

export function JobPreferenceForm({
  initialValue,
  isSaving,
  onClose,
  onSave,
}: JobPreferenceFormProps) {
  const [value, setValue] = useState<PreferenceInput>({
    desiredRoles: initialValue.desiredRoles,
    preferredLocations: initialValue.preferredLocations,
    preferredWorkTypes: initialValue.preferredWorkTypes,
  });
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await onSave(value);
      onClose();
    } catch {
      setError("Không thể lưu mong muốn công việc. Vui lòng thử lại.");
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <form
        onSubmit={(event) => void save(event)}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto no-scrollbar rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Mong muốn công việc
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Thêm tối đa 5 tag cho mỗi nhóm để hệ thống ưu tiên các cơ hội phù
              hợp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <TagField
            label="Vị trí mong muốn"
            placeholder="Ví dụ: Backend Developer"
            values={value.desiredRoles}
            suggestions={[
              "Frontend Developer",
              "Backend Developer",
              "Fullstack Developer",
              "Mobile Developer",
              "Tester / QA",
              "Data Analyst",
              "Embedded Engineer",
            ]}
            onChange={(desiredRoles) =>
              setValue((current) => ({ ...current, desiredRoles }))
            }
          />
          <TagField
            label="Địa điểm mong muốn"
            placeholder="Ví dụ: Hồ Chí Minh hoặc làm việc từ xa"
            values={value.preferredLocations}
            suggestions={[
              "TP. Hồ Chí Minh",
              "Hà Nội",
              "Đà Nẵng",
              "Bình Dương",
              "Đồng Nai",
              "Làm việc từ xa (Remote)",
            ]}
            onChange={(preferredLocations) =>
              setValue((current) => ({ ...current, preferredLocations }))
            }
          />
          <TagField
            label="Hình thức làm việc"
            placeholder="Ví dụ: Kết hợp tại công ty và từ xa"
            values={value.preferredWorkTypes}
            suggestions={[
              "Toàn thời gian (On-site)",
              "Làm việc từ xa (Remote)",
              "Kết hợp (Hybrid)",
              "Bán thời gian (Part-time)",
            ]}
            onChange={(preferredWorkTypes) =>
              setValue((current) => ({ ...current, preferredWorkTypes }))
            }
          />
        </div>

        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 shadow-2xs"
          >
            Hủy
          </button>
          <button
            disabled={isSaving}
            className="rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? "Đang lưu..." : "Lưu mong muốn"}
          </button>
        </div>
      </form>
    </div>
    </ModalPortal>
  );
}

function TagField({
  label,
  placeholder,
  values,
  onChange,
  suggestions = [],
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (textToAdd?: string) => {
    const next = (textToAdd ?? input).trim();
    if (!next) {
      inputRef.current?.focus();
      return;
    }
    if (values.length >= 5) {
      return;
    }
    if (values.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...values, next]);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800">
          {label}
        </label>
        <span className="text-[11px] font-semibold text-slate-400">
          {values.length}/5
        </span>
      </div>

      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 p-2 cursor-text transition-all focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100"
      >
        {values.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-bold text-teal-800 animate-in fade-in zoom-in-95 duration-150"
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(values.filter((value) => value !== item));
              }}
              className="rounded-full text-teal-600 hover:text-teal-900 transition"
              aria-label={`Bỏ ${item}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={input}
          disabled={values.length >= 5}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={values.length >= 5 ? "Đã đủ 5 lựa chọn" : placeholder}
          className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            add();
          }}
          disabled={values.length >= 5}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100/80 text-teal-700 hover:bg-teal-600 hover:text-white active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
          aria-label={`Thêm ${label}`}
          title="Nhập nội dung rồi bấm đây hoặc nhấn Enter để thêm"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {suggestions.length > 0 && values.length < 5 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Gợi ý nhanh:</span>
          {suggestions
            .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))
            .slice(0, 5)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 transition active:scale-95"
              >
                <Plus className="h-2.5 w-2.5 text-teal-600" />
                {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
