import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, CheckCircle2, Eye, EyeOff, GraduationCap, LockKeyhole, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../auth/api';
import { useAuth } from '../auth/AuthContext';
import { AuthRole, RegisterInput } from '../auth/auth.types';
import { roleHomePath } from '../auth/routes';
import { AuthLayout } from './AuthLayout';

export function RegisterPage() {
  const { user, isInitializing, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<RegisterInput['role']>('STUDENT');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterConfirmation, setShowRegisterConfirmation] = useState(false);

  useEffect(() => {
    if (!isInitializing && user && user.status === 'ACTIVE') {
      navigate(roleHomePath(user.role as AuthRole), { replace: true });
    }
  }, [isInitializing, navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setShowRegisterConfirmation(false);
    setIsSubmitting(true);

    try {
      await register({ email, password, role });
      setShowRegisterConfirmation(true);
    } catch (requestError) {
      const errorMessage = getApiErrorMessage(requestError);
      if (/already registered|already exists|đã được đăng ký/i.test(errorMessage)) {
        setError('');
        setShowRegisterConfirmation(true);
        return;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleButtonClass = (selected: boolean, company = false) => `role-button ${selected ? (company ? 'role-button-company selected-company' : 'role-button-student selected-student') : ''}`;

  return (
    <AuthLayout ctaTo="/login" ctaLabel="Đăng nhập">
      <div className="register-form-panel">
        <div className="register-heading">
          <h1>Đăng ký</h1>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <fieldset className="role-field">
            <legend>BẠN ĐĂNG KÝ VỚI VAI TRÒ</legend>
            <div className="role-grid">
              <button id="register-role-student" type="button" onClick={() => setRole('STUDENT')} className={roleButtonClass(role === 'STUDENT')}>
                <GraduationCap className="role-icon" /> <span>Sinh viên</span>
              </button>
              <button id="register-role-company" type="button" onClick={() => setRole('COMPANY')} className={roleButtonClass(role === 'COMPANY', true)}>
                <Building2 className="role-icon" /> <span>Doanh nghiệp</span>
              </button>
            </div>
          </fieldset>

          <label className="register-label">
            <span className="sr-only">Email</span>
            <span className="register-input-wrap">
              <Mail className="register-input-icon" />
              <input id="register-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="register-input" placeholder={role === 'STUDENT' ? 'student@careerbridge.com' : 'company@careerbridge.com'} />
            </span>
          </label>

          <label className="register-label">
            <span className="sr-only">Mật khẩu</span>
            <span className="register-input-wrap">
              <LockKeyhole className="register-input-icon" />
              <input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className="register-input password-input" placeholder="••••••••" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </span>
          </label>

          {error && <div id="register-error" className="register-error">{error}</div>}

          <button
            id="btn-register-submit"
            type="submit"
            disabled={isSubmitting}
            className="register-submit-button"
          >
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>
      </div>

      {showRegisterConfirmation && createPortal(
        <div className="register-confirmation-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="register-confirmation-title">
          <div className="register-confirmation-modal">
            <div className="register-confirmation-icon-wrap">
              <span className="register-confirmation-icon">
                <Mail className="register-confirmation-icon-mail" />
                <CheckCircle2 className="register-confirmation-icon-check" />
              </span>
            </div>

            <div className="register-confirmation-content">
              <h2 id="register-confirmation-title">Tài khoản đã được đăng ký</h2>
              <p>
                Vui lòng xác thực email. Một email xác thực đã được gửi đến địa chỉ email của bạn. Hãy kiểm tra hộp thư và làm theo hướng dẫn trong email để kích hoạt tài khoản.
              </p>

              <button type="button" className="register-confirmation-login-button" onClick={() => {
                setShowRegisterConfirmation(false);
                navigate('/login', { replace: true });
              }}>
                Đi đến đăng nhập
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </AuthLayout>
  );
}
