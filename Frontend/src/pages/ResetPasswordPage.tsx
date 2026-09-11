import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage, resetPassword } from '../auth/api';
import { AuthLayout } from './AuthLayout';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
      <section className="forgot-password-card" aria-labelledby="reset-password-title">
        <div className="forgot-password-icon" aria-hidden="true"><LockKeyhole /></div>
        <p className="forgot-password-kicker">Bảo mật tài khoản</p>
        <h1 id="reset-password-title">Đặt lại mật khẩu</h1>
        <p className="forgot-password-description">Tạo mật khẩu mới để bảo vệ tài khoản của bạn.</p>
        {!token ? <p className="forgot-password-error">Liên kết đặt lại mật khẩu không hợp lệ.</p> : (
          <form className="forgot-password-form reset-password-form" onSubmit={(event) => void handleSubmit(event)}>
            <label className="forgot-password-label"><span>Mật khẩu mới</span><span className="forgot-password-input-wrap"><LockKeyhole aria-hidden="true" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className="password-input" placeholder="Ít nhất 8 ký tự" /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
            <label className="forgot-password-label"><span>Xác nhận mật khẩu</span><span className="forgot-password-input-wrap"><LockKeyhole aria-hidden="true" /><input type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="password-input" placeholder="Nhập lại mật khẩu mới" /><button type="button" className="password-toggle" onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}>{showConfirmation ? <EyeOff /> : <Eye />}</button></span></label>
            {error && <div className="forgot-password-error">{error}</div>}
            <button type="submit" disabled={isSubmitting} className="forgot-password-submit">{isSubmitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}</button>
          </form>
        )}
        <Link className="forgot-password-back" to="/login"><ArrowLeft /> Quay lại đăng nhập</Link>
      </section>
    </AuthLayout>
  );
}
