import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage, requestPasswordReset } from '../auth/api';
import { AuthLayout } from './AuthLayout';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim().toLowerCase());
      setMessage(result.message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-indigo-600">Khôi phục tài khoản</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Quên mật khẩu</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
        {message ? (
          <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <MailCheck className="mb-2 h-5 w-5" />
            {message}
          </div>
        ) : (
          <form className="mt-7 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Email</span>
              <span className="relative mt-2 block">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="you@example.com" />
              </span>
            </label>
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 disabled:opacity-60">
              {isSubmitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}
        <p className="mt-7 text-center text-sm text-slate-500"><Link className="font-bold text-indigo-600 hover:text-indigo-700" to="/login">Quay lại đăng nhập</Link></p>
      </div>
    </AuthLayout>
  );
}