import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { JobPreferences } from '../../recommendations/types';

type PreferenceInput = Pick<
  JobPreferences,
  'desiredRoles' | 'preferredLocations' | 'preferredWorkTypes'
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
      setError('Không thể lưu mong muốn công việc. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => void save(event)}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Mong muốn công việc</h2>
            <p className="mt-1 text-sm text-slate-500">
              Thêm tối đa 5 tag cho mỗi nhóm để hệ thống ưu tiên các cơ hội phù hợp.
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
            onChange={(desiredRoles) => setValue((current) => ({ ...current, desiredRoles }))}
          />
          <TagField
            label="Địa điểm mong muốn"
            placeholder="Ví dụ: Hồ Chí Minh hoặc Remote"
            values={value.preferredLocations}
            onChange={(preferredLocations) =>
              setValue((current) => ({ ...current, preferredLocations }))
            }
          />
          <TagField
            label="Hình thức làm việc"
            placeholder="Ví dụ: Hybrid"
            values={value.preferredWorkTypes}
            onChange={(preferredWorkTypes) =>
              setValue((current) => ({ ...current, preferredWorkTypes }))
            }
          />
        </div>

        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu mong muốn'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TagField({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const next = input.trim();
    if (!next || values.length >= 5 || values.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    onChange([...values, next]);
    setInput('');
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-800">{label}</label>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 p-2 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
        {values.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-800">
            {item}
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== item))}
              className="rounded text-indigo-500 hover:text-indigo-800"
              aria-label={`Bỏ ${item}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          disabled={values.length >= 5}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={values.length >= 5 ? 'Đã đủ 5 lựa chọn' : placeholder}
          className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim() || values.length >= 5}
          className="rounded-lg p-1.5 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
          aria-label={`Thêm ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
