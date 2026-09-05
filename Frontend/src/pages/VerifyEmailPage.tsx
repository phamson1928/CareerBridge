import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
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
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Không tìm thấy mã xác thực.');
      return;
    }

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
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-12">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-indigo-500" />
            <h2 className="text-2xl font-black text-slate-900">Đang xác thực email...</h2>
            <p className="mt-2 text-slate-500">Vui lòng đợi trong giây lát.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
            <h2 className="text-2xl font-black text-slate-900">Xác thực thành công!</h2>
            <p className="mt-2 text-slate-500 mb-6">Tài khoản của bạn đã được kích hoạt.</p>
            <button
              onClick={() => {
                if (user) {
                  navigate(roleHomePath(user.role as AuthRole), { replace: true });
                } else {
                  navigate('/login', { replace: true });
                }
              }}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="mb-4 h-16 w-16 text-rose-500" />
            <h2 className="text-2xl font-black text-slate-900">Xác thực thất bại</h2>
            <p className="mt-2 text-rose-600 font-medium mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
            >
              Quay lại Đăng nhập
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
