import { FormEvent, useState } from 'react';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
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
      <section className="login-form-panel forgot-password-panel" aria-labelledby="forgot-password-title">
        <div className="login-title-wrap"><h1 id="forgot-password-title">Quên mật khẩu</h1></div>
        <p className="login-account-copy">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
        {message ? (
          <div className="forgot-password-success" role="status">
            <MailCheck />
            <span>{message}</span>
          </div>
        ) : (
          <form className="login-form forgot-password-form" onSubmit={(event) => void handleSubmit(event)}>
            <label className="login-label">
              <span className="sr-only">Email</span>
              <span className="relative mt-2 block">
                <Mail className="login-input-icon" aria-hidden="true" />
                <input className="login-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </span>
            </label>
            {error && <div className="forgot-password-error" role="alert">{error}</div>}
            <button type="submit" disabled={isSubmitting} className="login-submit-button forgot-password-submit">
              {isSubmitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </button>
          </form>
        )}
        <Link className="forgot-password-back" to="/login"><ArrowLeft /> Quay lại đăng nhập</Link>
      </section>
    </AuthLayout>
  );
}
