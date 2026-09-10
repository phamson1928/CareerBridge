import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthLayout({
  children,
  ctaTo = '/register',
  ctaLabel = 'Đăng ký',
}: {
  children: ReactNode;
  ctaTo?: string;
  ctaLabel?: string;
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
