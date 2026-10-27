import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, LockKeyhole, Loader2, Mail, XCircle } from 'lucide-react';
import { authApi } from '../auth/api';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../auth/AuthContext';
import { roleHomePath } from '../auth/routes';
import { AuthRole } from '../auth/auth.types';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const requestedTokenRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Không tìm thấy mã xác thực.');
      return;
    }

    // React StrictMode runs effects twice in development. A verification link
    // is single-use, so do not send a second request for the same token.
    if (requestedTokenRef.current === token) {
      return;
    }
    requestedTokenRef.current = token;

    const verify = async () => {
      try {
        await authApi.post('/auth/verify-email', { token });
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực email.');
      }
    };

    verify();
  }, [token]);

  return (
    <AuthLayout>
      <div className="login-form-panel" aria-hidden="true">
        <div className="login-title-wrap">
          <h1>Đăng nhập</h1>
        </div>
        <p className="login-account-copy">Đăng nhập vào tài khoản của bạn</p>
        <div className="login-form">
          <div className="login-label">
            <span className="relative mt-2 block">
              <Mail className="login-input-icon" />
              <input type="email" disabled className="login-input" placeholder="customer@eyewear.com" />
            </span>
          </div>
          <div className="login-label">
            <span className="relative mt-2 block">
              <LockKeyhole className="login-input-icon" />
              <input type="password" disabled className="login-input password-input" placeholder="••••••••" />
              <span className="password-toggle">
                <Eye />
              </span>
            </span>
          </div>
          <div className="login-submit-row">
            <button type="button" disabled className="login-submit-button">
              Đăng nhập
            </button>
          </div>
        </div>
      </div>

      {createPortal(
        <div
          className="register-confirmation-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-email-title"
        >
          <div className="register-confirmation-modal">
            <div className="register-confirmation-icon-wrap">
              <span className="register-confirmation-icon">
                {status === 'loading' && (
                  <Loader2 className="register-confirmation-icon-mail animate-spin" />
                )}
                {status === 'success' && (
                  <>
                    <Mail className="register-confirmation-icon-mail" />
                    <CheckCircle2 className="register-confirmation-icon-check" />
                  </>
                )}
                {status === 'error' && (
                  <XCircle className="h-9 w-9 text-rose-600" />
                )}
              </span>
            </div>

            <div className="register-confirmation-content">
              {status === 'loading' && (
                <>
                  <h2 id="verify-email-title">Đang xác thực email...</h2>
                  <p>Vui lòng đợi trong giây lát.</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <h2 id="verify-email-title">Xác thực thành công!</h2>
                  <p>Tài khoản của bạn đã được kích hoạt.</p>
                  <div className="register-confirmation-actions">
                    <button
                      type="button"
                      className="register-confirmation-login-button"
                      onClick={() => {
                        if (user) {
                          navigate(roleHomePath(user.role as AuthRole), { replace: true });
                        } else {
                          navigate('/login', { replace: true });
                        }
                      }}
                    >
                      Đi đến đăng nhập
                    </button>
                  </div>
                </>
              )}

              {status === 'error' && (
                <>
                  <h2 id="verify-email-title">Xác thực thất bại</h2>
                  <p className="text-rose-600 font-medium">{errorMessage}</p>
                  <div className="register-confirmation-actions">
                    <button
                      type="button"
                      className="register-confirmation-login-button"
                      onClick={() => navigate('/login', { replace: true })}
                    >
                      Quay lại đăng nhập
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </AuthLayout>
  );
}
