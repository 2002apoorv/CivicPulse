import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, quickLoginAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/complaints?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/dashboard') || p === '/') return 'Civic Operations & Intelligence';
    if (p.startsWith('/complaints/new')) return 'Submit New Citizen Grievance';
    if (p.startsWith('/complaints/')) return 'Grievance Intelligence Details';
    if (p.startsWith('/complaints')) return 'Public Grievance Explorer';
    if (p.startsWith('/map')) return 'Geospatial Hotspots & Coordinate Map';
    if (p.startsWith('/clusters')) return 'Candidate Recurring Issues (DBSCAN)';
    if (p.startsWith('/ai-governance')) return 'AI Model Governance & Evaluation';
    if (p.startsWith('/admin')) return 'Municipal Officers & Access Control';
    return 'CivicPulse';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Title & Live Status Indicator */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Varanasi Municipal Jurisdiction • Live</span>
          </div>
        </div>
      </div>

      {/* Global Search & Demo Role Switcher */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reference, landmark, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </form>

        {/* Quick Demo Role Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-500" /> Role:
          </span>
          <button
            onClick={() => quickLoginAs('admin')}
            className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
              user?.role === 'admin'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => quickLoginAs('officer')}
            className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
              user?.role === 'officer'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Officer
          </button>
          <button
            onClick={() => quickLoginAs('citizen')}
            className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
              user?.role === 'citizen'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Citizen
          </button>
        </div>
      </div>
    </header>
  );
};
