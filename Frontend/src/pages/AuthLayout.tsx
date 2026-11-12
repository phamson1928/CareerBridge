import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthLayout({
  children,
  ctaTo = '/register',
  ctaLabel = 'Đăng ký',
  hideMobileSwitch = false,
}: {
  children: ReactNode;
  ctaTo?: string;
  ctaLabel?: string;
  hideMobileSwitch?: boolean;
}) {
  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <section className="auth-left-panel">
          <div className="auth-form-wrap">
            <div className="auth-logo-wrap">
              <img src="/careerbridge-logo.svg" alt="CareerBridge" className="auth-logo" />
            </div>
            {children}
            {!hideMobileSwitch && ctaTo && ctaLabel && (
              <div className="auth-mobile-switch">
                <span>{ctaTo === '/register' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</span>
                <Link to={ctaTo} className="auth-mobile-switch-link">
                  {ctaLabel}
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="auth-right-panel">
          <div className="auth-promo-frame">
            <div className="auth-promo-backdrop" />
            <img src="/auth-careerbridge-illustration-v3.png" alt="Minh hoạ hành trình kết nối thực tập" className="auth-promo-image" />
            <div className="auth-promo-text">
              <span className="auth-promo-kicker">CareerBridge</span>
              <span className="auth-promo-title">Tìm nơi để bắt đầu,<br />xây dựng nơi để phát triển.</span>
            </div>
            <Link className="auth-register-button" to={ctaTo}>
              <span>{ctaLabel}</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
