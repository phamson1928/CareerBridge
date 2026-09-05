import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Building2, GraduationCap, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../auth/api';
import { useAuth } from '../auth/AuthContext';
import { AuthRole, RegisterInput } from '../auth/auth.types';
import { roleHomePath } from '../auth/routes';
import { AuthLayout } from './AuthLayout';
import { MailCheck } from 'lucide-react';

export function RegisterPage() {
  const { user, isInitializing, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterInput['role']>('STUDENT');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitializing && user && user.status === 'ACTIVE') navigate(roleHomePath(user.role as AuthRole), { replace: true });
  }, [isInitializing, navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register({ email, password, role });
      setRegisteredEmail(email);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleButtonClass = (selected: boolean, company = false) => `flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${selected ? company ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100' : 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`;

  return (
    <AuthLayout>
      {registeredEmail ? (
        <div className="rounded-3xl border border-emerald-200 bg-white p-9 text-center shadow-xl shadow-slate-200/60">
          <MailCheck className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Kiểm tra email của bạn!</h2>
          <p className="mt-2 text-slate-500 text-sm">
            Chúng tôi đã gửi link xác thực đến <strong>{registeredEmail}</strong>.<br/>
            Vui lòng mở email và click vào link để kích hoạt tài khoản.
          </p>
          <p className="mt-4 text-xs text-slate-400">Link sẽ hết hạn sau 24 giờ.</p>
          <p className="mt-6 text-sm text-slate-500">Đã có tài khoản? <Link className="font-bold text-indigo-600 hover:text-indigo-700" to="/login">Đăng nhập</Link></p>
        </div>
      ) : (
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <p className="text-sm font-bold text-indigo-600">Bắt đầu với CareerBridge</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Tạo tài khoản</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Hồ sơ chi tiết sẽ được hoàn thiện sau khi đăng ký.</p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-600">Bạn đăng ký với vai trò</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button id="register-role-student" type="button" onClick={() => setRole('STUDENT')} className={roleButtonClass(role === 'STUDENT')}><GraduationCap className="h-4 w-4" /> Sinh viên</button>
              <button id="register-role-company" type="button" onClick={() => setRole('COMPANY')} className={roleButtonClass(role === 'COMPANY', true)}><Building2 className="h-4 w-4" /> Doanh nghiệp</button>
            </div>
          </fieldset>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Email</span>
            <span className="relative mt-2 block"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="register-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="you@example.com" /></span>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Mật khẩu</span>
            <span className="relative mt-2 block"><LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="register-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Ít nhất 8 ký tự, gồm chữ và số" /></span>
          </label>
          {error && <div id="register-error" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          <button id="btn-register-submit" type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}</button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">Đã có tài khoản? <Link className="font-bold text-indigo-600 hover:text-indigo-700" to="/login">Đăng nhập</Link></p>
      </div>
      )}
    </AuthLayout>
  );
}
