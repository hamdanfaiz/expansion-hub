import React, { useState } from 'react';
import {
  Globe,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const LoginView: React.FC = () => {
  const { login, language } = useApp();
  const isEn = language === 'en';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage(
        isEn
          ? 'Please enter both your username and password.'
          : 'Harap masukkan username dan password Anda.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(cleanUser, password, rememberMe);
      if (!result.ok) {
        setErrorMessage(
          isEn
            ? 'Invalid username or password.'
            : 'Username atau password yang Anda masukkan tidak sesuai.'
        );
      }
    } catch {
      setErrorMessage(
        isEn
          ? 'Unable to sign in right now. Please try again.'
          : 'Tidak dapat masuk saat ini. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans antialiased">
      {/* Top Bar */}
      <header className="w-full border-b border-slate-200 bg-white px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Globe className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Global Partner Expansion Hub
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="header" />
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isEn ? 'Sign in to Workspace' : 'Masuk ke Workspace'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isEn
                ? 'Enter your account credentials to continue.'
                : 'Masukkan kredensial akun Anda untuk melanjutkan.'}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isEn ? 'Enter your username' : 'Masukkan username'}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEn ? 'Enter your password' : 'Masukkan password'}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? isEn
                        ? 'Hide password'
                        : 'Sembunyikan password'
                      : isEn
                      ? 'Show password'
                      : 'Tampilkan password'
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-600">
                  {isEn ? 'Keep me signed in for 7 days' : 'Ingat sesi login selama 7 hari'}
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-60 transition cursor-pointer"
              >
                <span>
                  {isSubmitting
                    ? isEn
                      ? 'Signing in...'
                      : 'Memproses...'
                    : isEn
                    ? 'Sign In to Workspace'
                    : 'Masuk ke Workspace'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-slate-200 bg-white px-6 py-3 text-center text-[11px] text-slate-500">
        <span>Global Partner Expansion Hub</span>
      </footer>
    </div>
  );
};
