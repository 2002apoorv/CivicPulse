import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Map, 
  Layers, 
  Cpu, 
  Users, 
  LogOut, 
  ShieldAlert,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, logout, isOfficer, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Intelligence Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Grievances Explorer', path: '/complaints', icon: FileText },
    { label: 'Submit Grievance', path: '/complaints/new', icon: PlusCircle },
    { label: 'Geospatial Intelligence Map', path: '/map', icon: Map },
    { label: 'Recurring Clusters', path: '/clusters', icon: Layers },
    { label: 'AI Model Governance', path: '/ai-governance', icon: Cpu },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Officer & User Access', path: '/admin', icon: Users });
  }

  const roleBadgeStyle = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
    officer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    citizen: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[user?.role] || 'bg-slate-100 text-slate-700';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base">CivicPulse</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">AI</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Grievance Intelligence</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Municipal Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Profile & Logout Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.full_name || 'Guest User'}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium uppercase tracking-wider ${roleBadgeStyle}`}>
                {user?.role || 'Guest'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-slate-200 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
