import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Sparkles, AlertCircle, ArrowRight, ShieldCheck, User, HardHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, quickLoginAs } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLoginAs(role);
      navigate('/dashboard');
    } catch (err) {
      setError("Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 selection:bg-indigo-100 selection:text-indigo-800">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 mx-auto">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CivicPulse</h1>
            <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">AI</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">AI Grievance Intelligence & Operations Platform</p>
        </div>

        {/* Quick Demo Switcher Cards (For Evaluators) */}
        <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-100 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Instant Demo Logins (Click to sign in instantly):
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2.5 bg-white hover:bg-indigo-50/60 rounded-lg border border-indigo-200/80 text-left transition-all hover:shadow-2xs group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-600" /> Admin
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Full System</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('officer')}
              className="p-2.5 bg-white hover:bg-indigo-50/60 rounded-lg border border-indigo-200/80 text-left transition-all hover:shadow-2xs group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                <HardHat className="h-3.5 w-3.5 text-indigo-600" /> Officer
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Roads & Drain</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('citizen')}
              className="p-2.5 bg-white hover:bg-indigo-50/60 rounded-lg border border-indigo-200/80 text-left transition-all hover:shadow-2xs group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                <User className="h-3.5 w-3.5 text-emerald-600" /> Citizen
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Priya Resident</p>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@civicpulse.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Sign In to CivicPulse"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Need a citizen account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
