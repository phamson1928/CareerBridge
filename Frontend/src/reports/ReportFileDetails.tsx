import { Download, FileText } from 'lucide-react';
import { formatDateTime, formatFileSize } from '../utils/format';
import type { ReportRecord } from './types';

interface Props {
  file: NonNullable<ReportRecord['file']>;
  onDownload: (fileId: string) => void;
}

export function ReportFileDetails({ file, onDownload }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <button
        type="button"
        onClick={() => onDownload(file.id)}
        className="inline-flex max-w-full items-center gap-2 text-left text-xs font-bold text-slate-700 hover:text-blue-700"
      >
        <FileText className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="truncate">{file.originalName}</span>
        <Download className="h-4 w-4 shrink-0 text-blue-600" aria-label="Tải tệp" />
      </button>
      <dl className="mt-2 grid gap-x-4 gap-y-1 text-[11px] text-slate-500 sm:grid-cols-3">
        <div><dt className="sr-only">Định dạng</dt><dd>{file.mimeType}</dd></div>
        <div><dt className="sr-only">Kích thước</dt><dd>{formatFileSize(file.sizeBytes)}</dd></div>
        <div><dt className="sr-only">Ngày tải lên</dt><dd>Tải lên {formatDateTime(file.createdAt)}</dd></div>
      </dl>
    </div>
  );
}
