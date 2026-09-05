import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../auth/api';
import { useAuth } from '../auth/AuthContext';
import { roleHomePath } from '../auth/routes';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const { user, isInitializing, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitializing && user) navigate(roleHomePath(user.role), { replace: true });
  }, [isInitializing, navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const authenticatedUser = await login({ email, password });
      const requestedPath = (location.state as { from?: string } | null)?.from;
      navigate(requestedPath ?? roleHomePath(authenticatedUser.role), { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 lg:hidden">
        <p className="text-2xl font-black text-indigo-950">CareerBridge</p>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Cổng thông tin thực tập</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <p className="text-sm font-bold text-indigo-600">Chào mừng trở lại</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Đăng nhập</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Sử dụng tài khoản CareerBridge để tiếp tục.</p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Email</span>
            <span className="relative mt-2 block">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="you@example.com" />
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Mật khẩu</span>
            <span className="relative mt-2 block">
              <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Nhập mật khẩu" />
            </span>
          </label>
          {error && <div id="login-error" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          <button id="btn-login-submit" type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">Chưa có tài khoản? <Link className="font-bold text-indigo-600 hover:text-indigo-700" to="/register">Đăng ký ngay</Link></p>
      </div>
    </AuthLayout>
  );
}
