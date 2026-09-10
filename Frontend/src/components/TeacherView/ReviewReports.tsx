import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { downloadPrivateFile } from '../../files/api';
import { ReportFileDetails } from '../../reports/ReportFileDetails';
import { reportsApi } from '../../reports/api';
import type { ReportRecord } from '../../reports/types';

export const ReviewReports = () => {
  const [items, setItems] = useState<ReportRecord[]>([]);
  const [selected, setSelected] = useState<ReportRecord | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setItems((await reportsApi.supervised({ limit: 100 })).items); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  };

  useEffect(() => { void load(); }, []);

  const review = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    setBusy(true);
    try {
      await reportsApi.review(selected.id, { status, feedback: feedback || undefined });
      setSelected(null);
      setFeedback('');
      await load();
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const download = async (fileId: string) => {
    try { await downloadPrivateFile(fileId); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">Duyệt báo cáo tuần</h2>
        <p className="mt-1 text-xs text-slate-500">Báo cáo của sinh viên đang được bạn hướng dẫn.</p>
      </div>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
      <div className="space-y-3">
        {items.map((report) => (
          <article key={report.id} className="rounded-2xl border bg-white p-5">
            <div className="flex justify-between gap-3">
              <div>
                <h3 className="font-bold">{report.placement.student.fullName} · Tuần {report.week}</h3>
                <p className="text-xs text-slate-500">{report.placement.student.studentCode} · {report.placement.company.companyName}</p>
              </div>
              <b className="text-xs">{report.status}</b>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{report.content}</p>
            {report.file && <div className="mt-3"><ReportFileDetails file={report.file} onDownload={download} /></div>}
            {report.status === 'SUBMITTED' && <button type="button" onClick={() => { setSelected(report); setFeedback(''); }} className="mt-4 ml-auto block rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white">Duyệt & nhận xét</button>}
          </article>
        ))}
      </div>
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6"><button type="button" className="float-right" onClick={() => setSelected(null)}><X /></button><h3 className="font-bold">Tuần {selected.week} · {selected.placement.student.fullName}</h3><textarea rows={4} className="mt-4 w-full rounded border p-2" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Nhận xét cho sinh viên" /><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={() => void review('APPROVED')} className="rounded-xl bg-emerald-600 p-2 text-sm font-bold text-white"><Check className="inline w-4" /> Duyệt</button><button type="button" disabled={busy} onClick={() => void review('REJECTED')} className="rounded-xl bg-rose-100 p-2 text-sm font-bold text-rose-800">Yêu cầu sửa</button></div></div></div>}
    </div>
  );
};
