import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

type FeedbackTone = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  message?: string;
  tone: FeedbackTone;
};

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
};

type PromptOptions = {
  title: string;
  label: string;
  defaultValue?: string;
  confirmLabel?: string;
};

type Dialog =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (result: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (result: string | null) => void };

type FeedbackContextValue = {
  notify: (toast: Omit<Toast, "id">) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export const AppFeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [inputValue, setInputValue] = useState("");
  const toastId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++toastId.current;
    setToasts((items) => [...items, { ...toast, id }]);
    window.setTimeout(() => dismissToast(id), 4500);
  }, [dismissToast]);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setDialog({ kind: "confirm", options, resolve });
  }), []);

  const prompt = useCallback((options: PromptOptions) => new Promise<string | null>((resolve) => {
    setDialog({ kind: "prompt", options, resolve });
  }), []);

  useEffect(() => {
    setInputValue(dialog?.kind === "prompt" ? dialog.options.defaultValue ?? "" : "");
  }, [dialog]);

  const closeDialog = (result: boolean | string | null) => {
    if (!dialog) return;
    if (dialog.kind === "confirm") dialog.resolve(Boolean(result));
    else dialog.resolve(typeof result === "string" ? result : null);
    setDialog(null);
  };

  return (
    <FeedbackContext.Provider value={{ notify, confirm, prompt }}>
      {children}
      <div className="fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => <ToastCard key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />)}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Đóng hộp thoại" onClick={() => closeDialog(null)} />
          <form onSubmit={(event) => { event.preventDefault(); closeDialog(dialog.kind === "prompt" ? inputValue : true); }} className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => closeDialog(null)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng"><X className="h-5 w-5" /></button>
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${dialog.kind === "confirm" && dialog.options.tone === "danger" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}>
              {dialog.kind === "confirm" && dialog.options.tone === "danger" ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <h2 id="feedback-dialog-title" className="mt-4 text-lg font-black text-slate-900">{dialog.options.title}</h2>
            {dialog.kind === "confirm" ? <p className="mt-2 text-sm leading-6 text-slate-600">{dialog.options.message}</p> : <label className="mt-4 block text-sm font-semibold text-slate-700">{dialog.options.label}<input autoFocus value={inputValue} onChange={(event) => setInputValue(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => closeDialog(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Hủy</button><button className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${dialog.kind === "confirm" && dialog.options.tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>{dialog.kind === "confirm" ? dialog.options.confirmLabel ?? "Xác nhận" : dialog.options.confirmLabel ?? "Lưu"}</button></div>
          </form>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

const ToastCard: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
    info: "border-indigo-200 bg-indigo-50 text-indigo-800",
  } satisfies Record<FeedbackTone, string>;
  const icon = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  } satisfies Record<FeedbackTone, React.ReactNode>;
  return <div className={`flex gap-3 rounded-2xl border p-4 shadow-lg ${styles[toast.tone]}`}><span className="shrink-0">{icon[toast.tone]}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{toast.title}</p>{toast.message && <p className="mt-0.5 text-xs leading-5">{toast.message}</p>}</div><button type="button" onClick={onClose} className="h-fit rounded p-1 opacity-60 hover:bg-white/50 hover:opacity-100" aria-label="Đóng"><X className="h-4 w-4" /></button></div>;
};

export function useAppFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useAppFeedback must be used inside AppFeedbackProvider");
  return context;
}