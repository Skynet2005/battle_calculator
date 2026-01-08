'use client';

import { useEffect, useState } from 'react';
import { FormField } from '@/shared/ui';

interface AuthGateProps {
  onAuthSuccess: (user: { email: string; username: string }) => void;
}

export default function AuthGate({ onAuthSuccess }: AuthGateProps) {
  const [authStatus, setAuthStatus] = useState<'checking' | 'unauthorized' | 'authorized'>('checking');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    username: '',
    password: '',
  });
  const [authUser, setAuthUser] = useState<{ email: string; username: string } | null>(null);
  void authUser;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const user = await res.json().catch(() => null);
          if (user) {
            const userData = { email: user.email, username: user.username };
            setAuthUser(userData);
            setAuthStatus('authorized');
            setAuthError(null);
            onAuthSuccess(userData);
          } else {
            setAuthUser(null);
            setAuthStatus('unauthorized');
          }
        } else {
          setAuthUser(null);
          setAuthStatus('unauthorized');
        }
      } catch (err) {
        console.error('Auth check failed', err);
        setAuthUser(null);
        setAuthStatus('unauthorized');
      }
    };
    checkAuth();
  }, [onAuthSuccess]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        authMode === 'login'
          ? { username: authForm.username || authForm.email, password: authForm.password }
          : { email: authForm.email, username: authForm.username, password: authForm.password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setAuthError(body?.error || 'Authentication failed');
        setAuthStatus('unauthorized');
        setAuthUser(null);
      } else {
        const user = await fetch('/api/profile', { credentials: 'include' }).then((r) => r.json()).catch(() => null);
        if (user) {
          const userData = { email: user.email, username: user.username };
          setAuthUser(userData);
          setAuthStatus('authorized');
          setAuthError(null);
          onAuthSuccess(userData);
        }
      }
    } catch (err) {
      console.error('Auth submit failed', err);
      setAuthError('Something went wrong, please try again.');
      setAuthStatus('unauthorized');
      setAuthUser(null);
    } finally {
      setAuthSubmitting(false);
    }
  };

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-4">
        <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus !== 'authorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-4">
        <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
          <h1 className="text-2xl font-bold mb-2 text-center">Expedition Battle Calculator</h1>
          <p className="text-sm text-slate-300 mb-6 text-center">
            Please {authMode === 'login' ? 'sign in' : 'create an account'} to continue.
          </p>
          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <FormField label="Email" htmlFor="email" required>
                <input
                  id="email"
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                  placeholder="you@example.com"
                />
              </FormField>
            )}
            <FormField label="Username" htmlFor="username" required>
              <input
                id="username"
                type="text"
                required
                value={authForm.username}
                onChange={(e) => setAuthForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                placeholder="username"
              />
            </FormField>
            <FormField label="Password" htmlFor="password" required error={authError || undefined}>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={authForm.password}
                onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                placeholder="********"
              />
            </FormField>
            <button
              type="submit"
              disabled={authSubmitting}
              className="button w-full"
            >
              {authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
          <div className="mt-4 text-sm text-center text-slate-300">
            {authMode === 'login' ? (
              <>
                No account?{' '}
                <button className="text-blue-400 hover:underline" onClick={() => setAuthMode('register')}>
                  Register
                </button>
              </>
            ) : (
              <>
                Have an account?{' '}
                <button className="text-blue-400 hover:underline" onClick={() => setAuthMode('login')}>
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
