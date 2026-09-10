import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="login-form-panel">
        <div className="login-title-wrap">
          <h1>Đăng nhập</h1>
        </div>

        <p className="login-account-copy">Đăng nhập vào tài khoản của bạn</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            <span className="sr-only">Email</span>
            <span className="relative mt-2 block">
              <Mail className="login-input-icon" />
              <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="login-input" placeholder="customer@eyewear.com" />
            </span>
          </label>
          <label className="login-label">
            <span className="sr-only">Mật khẩu</span>
            <span className="relative mt-2 block">
              <LockKeyhole className="login-input-icon" />
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="login-input password-input" placeholder="••••••••" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </span>
          </label>

          {error && <div id="login-error" className="login-error">{error}</div>}

          <div className="login-bar-link">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <div className="login-submit-row">
            <button id="btn-login-submit" type="submit" disabled={isSubmitting} className="login-submit-button">
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
