// campus-connect/frontend/src/components/LoginModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User, ShieldCheck, LogIn, UserPlus, AlertTriangle } from 'lucide-react';

export default function LoginModal({
  isOpen,
  onClose,
  initialRole = 'student',
  onLoginSuccess
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [roleTab, setRoleTab] = useState(initialRole); // 'student' | 'admin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialRole === 'admin' ? 'admin@equinox.edu' : 'student@equinox.edu');
  const [password, setPassword] = useState(initialRole === 'admin' ? 'admin123' : 'student123');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRoleTab(initialRole);
    if (mode === 'login') {
      if (initialRole === 'admin') {
        setEmail('admin@equinox.edu');
        setPassword('admin123');
      } else {
        setEmail('student@equinox.edu');
        setPassword('student123');
      }
    }
    setError('');
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const switchRolePreset = (role) => {
    setRoleTab(role);
    setError('');
    if (mode === 'login') {
      if (role === 'admin') {
        setEmail('admin@equinox.edu');
        setPassword('admin123');
      } else {
        setEmail('student@equinox.edu');
        setPassword('student123');
      }
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : { name, email, password, role: roleTab, roll_number: rollNumber };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div>
            <h2 className="text-base font-bold">
              {mode === 'login' ? 'Sign In to CampusConnect' : 'Create CampusConnect Account'}
            </h2>
            <p className="text-xs text-slate-300">
              Choose Student or Admin / Staff Portal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Role Selector Tabs: Student vs Admin */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => switchRolePreset('student')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                roleTab === 'student'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Student Login
            </button>
            <button
              type="button"
              onClick={() => switchRolePreset('admin')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                roleTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin / Staff Login
            </button>
          </div>

          {/* 1-Click Fast Demo Login Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 block">
              ⚡ 1-Click Instant Demo Sign In:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('student@equinox.edu', 'student123')}
                className="py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <User className="w-3.5 h-3.5 text-sky-600" />
                Demo Student
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('admin@equinox.edu', 'admin123')}
                className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Demo Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Aarav Sharma"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                {roleTab === 'student' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Student Roll Number</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={e => setRollNumber(e.target.value)}
                      placeholder="e.g., EIT2024CS108"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-slate-900"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Campus Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={roleTab === 'admin' ? 'admin@equinox.edu' : 'student@equinox.edu'}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {loading
                ? 'Signing in...'
                : mode === 'login'
                ? `Sign In as ${roleTab === 'admin' ? 'Admin / Staff' : 'Student'}`
                : `Create ${roleTab === 'admin' ? 'Admin' : 'Student'} Account`}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-600">
            {mode === 'login' ? (
              <>
                New to CampusConnect?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setEmail('');
                    setPassword('');
                  }}
                  className="font-bold text-slate-900 underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    switchRolePreset(roleTab);
                  }}
                  className="font-bold text-slate-900 underline"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
