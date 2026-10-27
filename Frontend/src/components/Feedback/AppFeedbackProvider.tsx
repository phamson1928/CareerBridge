import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, Info, ShieldCheck, X, XCircle } from "lucide-react";

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

  const isDanger = dialog?.kind === "confirm" && dialog.options.tone === "danger";

  return (
    <FeedbackContext.Provider value={{ notify, confirm, prompt }}>
      {children}
      <div className="fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => <ToastCard key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />)}
      </div>
      {dialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#02101f]/62 p-5 backdrop-blur-[2px] animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Đóng hộp thoại"
            onClick={() => closeDialog(null)}
          />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              closeDialog(dialog.kind === "prompt" ? inputValue : true);
            }}
            className={`relative flex w-full max-w-[540px] flex-col items-center justify-center rounded-[30px] border border-white/90 px-6 py-8 text-center text-[#172a3d] shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:px-9 ${
              isDanger
                ? "bg-gradient-to-b from-white to-[#fff5f6]"
                : "bg-gradient-to-b from-white to-[#eefbfb]"
            }`}
          >
            <button
              type="button"
              onClick={() => closeDialog(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-center">
              <span
                className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 ${
                  isDanger
                    ? "border-[#f4b9c0] bg-[#fff0f2] shadow-[0_12px_24px_rgba(218,28,45,0.14)]"
                    : "border-[#96d9d7] bg-[#e7f8f6] shadow-[0_12px_24px_rgba(0,135,138,0.16)]"
                }`}
              >
                {isDanger ? (
                  <>
                    <AlertTriangle className="h-9 w-9 text-[#da1c2d]" />
                    <XCircle className="absolute -bottom-0.5 -right-1 h-7 w-7 rounded-full border-[3px] border-[#fff0f2] bg-white p-[3px] text-[#da1c2d]" />
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-9 w-9 text-[#00878a]" />
                    <CheckCircle2 className="absolute -bottom-0.5 -right-1 h-7 w-7 rounded-full border-[3px] border-[#e7f8f6] bg-white p-[3px] text-[#0aaf8d]" />
                  </>
                )}
              </span>
            </div>

            <h2
              id="feedback-dialog-title"
              className="mt-5 text-2xl font-black leading-tight text-[#172a3d] sm:text-[28px]"
            >
              {dialog.options.title}
            </h2>

            {dialog.kind === "confirm" ? (
              <p className="mx-auto mt-3.5 max-w-[460px] text-[15px] leading-[1.8] text-[#4b5968]">
                {dialog.options.message}
              </p>
            ) : (
              <label className="mt-4 block w-full max-w-[440px] text-left text-sm font-bold text-[#172a3d]">
                {dialog.options.label}
                <input
                  autoFocus
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[#d8dce4] bg-[#eef3f4] px-4 text-sm font-normal text-[#23323f] outline-none transition-all focus:border-[#00878a] focus:bg-white focus:ring-4 focus:ring-[#00878a]/12"
                />
              </label>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => closeDialog(null)}
                className="h-[46px] min-w-[130px] rounded-[14px] border-2 border-[#f4b9c0] bg-[#fff0f2] px-5 text-sm font-black uppercase tracking-[0.6px] text-[#da1c2d] transition-colors duration-150 hover:border-[#da1c2d] hover:bg-[#ffdce1]"
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`h-[46px] min-w-[160px] rounded-[14px] border-2 px-6 text-sm font-black uppercase tracking-[0.6px] text-white transition-colors duration-150 ${
                  isDanger
                    ? "border-[#da1c2d] bg-[#da1c2d] hover:border-[#7a0913] hover:bg-[#b51221]"
                    : "border-[#00878a] bg-[#00878a] hover:border-[#004244] hover:bg-[#006669]"
                }`}
              >
                {dialog.kind === "confirm"
                  ? dialog.options.confirmLabel ?? "Xác nhận"
                  : dialog.options.confirmLabel ?? "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

const ToastCard: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const isError = toast.tone === "error";
  return (
    <div
      className={`flex items-center gap-3.5 rounded-[22px] border border-white/90 px-4 py-3.5 text-[#172a3d] shadow-[0_18px_40px_rgba(0,0,0,0.18)] ${
        isError
          ? "bg-gradient-to-b from-white to-[#fff5f6]"
          : "bg-gradient-to-b from-white to-[#eefbfb]"
      }`}
    >
      <span
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
          isError
            ? "border-[#f4b9c0] bg-[#fff0f2] text-[#da1c2d]"
            : "border-[#96d9d7] bg-[#e7f8f6] text-[#00878a]"
        }`}
      >
        {toast.tone === "success" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : toast.tone === "error" ? (
          <XCircle className="h-5 w-5" />
        ) : (
          <BellRing className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[#172a3d]">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs leading-relaxed text-[#4b5968]">
            {toast.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Đóng"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export function useAppFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useAppFeedback must be used inside AppFeedbackProvider");
  return context;
}
