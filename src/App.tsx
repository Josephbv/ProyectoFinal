import { useState, useEffect } from "react";
import { DashboardLayout as Dashboard } from "./features/dashboard/components/DashboardLayout";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { Toaster } from "./shared/components/sonner";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const saved = localStorage.getItem('kaivet_auth_data');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.token && data.usuario) {
            setIsAuthenticated(true);
          }
        } catch {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
    window.addEventListener('kaivet-auth-update', checkAuth);
    return () => window.removeEventListener('kaivet-auth-update', checkAuth);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Cargando...
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <Dashboard onLogout={() => {
          localStorage.removeItem('kaivet_auth_data');
          setIsAuthenticated(false);
        }} />
      )}
      <Toaster position="bottom-right" theme="dark" richColors />
    </>
  );
}
