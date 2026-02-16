'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, Gamepad2 } from 'lucide-react';
import { FormField } from '@/shared/ui';
import { useAuthUser, useLogin, useRegister, useGameLogin } from '@/shared/hooks/useAuth';
import { toast } from '@/shared/utils/toast';

interface AuthGateProps {
  onAuthSuccess: (user: { email: string; username: string }) => void;
}

export default function AuthGate({ onAuthSuccess }: AuthGateProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'game'>('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    username: '',
    password: '',
    roleId: '',
  });

  // Track if we've already called onAuthSuccess for the current user
  const lastAuthUserIdRef = useRef<string | null>(null);

  // Use React Query hooks
  const { data: authUser, isLoading: isCheckingAuth } = useAuthUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const gameLoginMutation = useGameLogin();

  // Store onAuthSuccess in a ref to avoid dependency issues
  const onAuthSuccessRef = useRef(onAuthSuccess);
  useEffect(() => {
    onAuthSuccessRef.current = onAuthSuccess;
  }, [onAuthSuccess]);

  // Determine auth status from React Query state
  const authStatus = isCheckingAuth ? 'checking' : authUser ? 'authorized' : 'unauthorized';
  const authSubmitting = loginMutation.isPending || registerMutation.isPending || gameLoginMutation.isPending;
  const authError = loginMutation.error?.message || registerMutation.error?.message || gameLoginMutation.error?.message || null;

  // Call onAuthSuccess when user is authenticated (only once per user)
  useEffect(() => {
    if (authUser && authUser.id !== lastAuthUserIdRef.current) {
      lastAuthUserIdRef.current = authUser.id;
      const userData = { email: authUser.email, username: authUser.username };
      onAuthSuccessRef.current(userData);
    } else if (!authUser) {
      // Reset ref when user logs out
      lastAuthUserIdRef.current = null;
    }
  }, [authUser?.id]); // Only depend on user ID

  // Clear errors when switching modes
  useEffect(() => {
    loginMutation.reset();
    registerMutation.reset();
    gameLoginMutation.reset();
    setAuthForm({ email: '', username: '', password: '', roleId: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode]); // Only depend on authMode, not mutation objects

  // No need for separate error handling useEffects - errors are handled in mutation callbacks

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === 'game') {
      if (!authForm.roleId.trim()) {
        toast.error('Role ID required', 'Please enter your game Role ID');
        return;
      }
      gameLoginMutation.mutate(authForm.roleId.trim(), {
        onSuccess: () => {
          toast.success('Game login successful!', 'Welcome');
        },
        onError: (error) => {
          toast.error('Game login failed', error.message || 'Invalid Role ID');
        },
      });
    } else if (authMode === 'login') {
      loginMutation.mutate(
        {
          username: authForm.username || authForm.email,
          password: authForm.password,
        },
        {
          onSuccess: () => {
            toast.success('Login successful!', 'Welcome back');
          },
          onError: (error) => {
            toast.error('Login failed', error.message || 'Invalid credentials');
          },
        }
      );
    } else {
      registerMutation.mutate(
        {
          email: authForm.email,
          username: authForm.username,
          password: authForm.password,
        },
        {
          onSuccess: () => {
            toast.success('Registration successful!', 'Account created');
          },
          onError: (error) => {
            toast.error('Registration failed', error.message || 'Failed to create account');
          },
        }
      );
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
            {authMode === 'game'
              ? 'Login with your game Role ID'
              : authMode === 'login'
              ? 'Please sign in to continue'
              : 'Create an account to continue'}
          </p>

          {/* Mode selector tabs */}
          <div className="flex gap-2 mb-4 border-b border-slate-700">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                authMode === 'login'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                authMode === 'register'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('game')}
              className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                authMode === 'game'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Game Login
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            {authMode === 'game' ? (
              <FormField label="Game Role ID" htmlFor="roleId" required error={authError || undefined}>
                <input
                  id="roleId"
                  type="text"
                  required
                  value={authForm.roleId}
                  onChange={(e) => setAuthForm((f) => ({ ...f, roleId: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                  placeholder="100579922"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Enter your in-game Role ID (found in your profile)
                </p>
              </FormField>
            ) : (
              <>
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
                  {authMode === 'register' && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      At least 8 characters, with uppercase, lowercase, number, and special character
                    </p>
                  )}
                </FormField>
              </>
            )}
            <button
              type="submit"
              disabled={authSubmitting}
              className="button w-full flex items-center justify-center gap-2"
              aria-busy={authSubmitting}
            >
              {authSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                authMode === 'game' ? (
                  <>
                    <Gamepad2 className="w-4 h-4" />
                    Login with Game
                  </>
                ) : authMode === 'login' ? 'Login' : 'Register'
              )}
            </button>
            {authError && (
              <div className="text-sm text-red-400 text-center mt-2" role="alert">
                {authError}
              </div>
            )}
          </form>
          {authMode !== 'game' && (
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
          )}
        </div>
      </div>
    );
  }

  return null;
}
