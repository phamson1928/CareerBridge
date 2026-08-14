import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { semestersApi } from '../../semesters/api';
import type { SemesterRecord, SemesterStatus } from '../../semesters/types';

const labels: Record<SemesterStatus, string> = {
  UPCOMING: 'Sắp diễn ra',
  ACTIVE: 'Đang hoạt động',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

interface SemesterSelectProps {
  value: string;
  onChange: (semesterId: string) => void;
  allowedStatuses?: SemesterStatus[];
  includeAllOption?: boolean;
  allOptionLabel?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  id?: string;
}

export const SemesterSelect: React.FC<SemesterSelectProps> = ({
  value,
  onChange,
  allowedStatuses,
  includeAllOption = false,
  allOptionLabel = 'Tất cả kỳ thực tập',
  disabled = false,
  required = false,
  label,
  error,
  id,
}) => {
  const [items, setItems] = useState<SemesterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const statusKey = useMemo(
    () => (allowedStatuses ?? []).join(','),
    [allowedStatuses],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await semestersApi.list({ limit: 100 });
        const allowed = statusKey ? statusKey.split(',') : undefined;
        if (active) {
          setItems(
            allowed
              ? result.items.filter((item) => allowed.includes(item.status))
              : result.items,
          );
        }
      } catch (requestError) {
        if (active) setLoadError(getApiErrorMessage(requestError));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [statusKey]);

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs font-bold text-slate-800">
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          required={required}
          disabled={disabled || isLoading}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-300 bg-white p-2.5 pr-9 text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          {includeAllOption ? (
            <option value="">{allOptionLabel}</option>
          ) : (
            <option value="" disabled>
              Chọn kỳ thực tập
            </option>
          )}
          {items.map((semester) => (
            <option key={semester.id} value={semester.id}>
              {semester.name} — {labels[semester.status]}
            </option>
          ))}
        </select>
        {isLoading && (
          <LoaderCircle className="pointer-events-none absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>
      {(error || loadError) && (
        <p className="mt-1 text-xs text-rose-600">{error || loadError}</p>
      )}
    </div>
  );
};
