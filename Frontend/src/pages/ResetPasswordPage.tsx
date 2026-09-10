import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage, resetPassword } from '../auth/api';
import { AuthLayout } from './AuthLayout';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate('/login', { replace: true, state: { message: 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập.' } });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><LockKeyhole className="h-6 w-6" /></div>
        <p className="text-sm font-bold text-indigo-600">Bảo mật tài khoản</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Đặt lại mật khẩu</h2>
        {!token ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Liên kết đặt lại mật khẩu không hợp lệ.</p> : (
          <form className="mt-7 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">Mật khẩu mới</span><input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Ít nhất 8 ký tự, gồm chữ và số" /></label>
            <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">Xác nhận mật khẩu</span><input type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Nhập lại mật khẩu mới" /></label>
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 disabled:opacity-60">{isSubmitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}</button>
          </form>
        )}
        <p className="mt-7 text-center text-sm text-slate-500"><Link className="font-bold text-indigo-600 hover:text-indigo-700" to="/login">Quay lại đăng nhập</Link></p>
      </div>
    </AuthLayout>
  );
}