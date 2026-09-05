import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { AuthenticatedHome, ProtectedRoute, RoleRoute } from './auth/routes';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthenticatedHome />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/student/*" element={<ProtectedRoute><RoleRoute role="STUDENT"><App /></RoleRoute></ProtectedRoute>} />
          <Route path="/company/*" element={<ProtectedRoute><RoleRoute role="COMPANY"><App /></RoleRoute></ProtectedRoute>} />
          <Route path="/lecturer/*" element={<ProtectedRoute><RoleRoute role="LECTURER"><App /></RoleRoute></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute><RoleRoute role="ADMIN"><App /></RoleRoute></ProtectedRoute>} />
          <Route path="*" element={<AuthenticatedHome />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
