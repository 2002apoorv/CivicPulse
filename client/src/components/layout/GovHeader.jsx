import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Map, 
  Layers, 
  Cpu, 
  FileText, 
  LayoutDashboard, 
  Search, 
  Volume2, 
  Sparkles, 
  PlusCircle, 
  ShieldCheck,
  Clock,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const GovHeader = () => {
  const { user, quickLoginAs, logout, isAdmin } = useAuth();
  const { language, setLanguage, changeFontSize, isHindi } = useLanguage();
  const [currentTime, setCurrentTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Live ticking IST clock (UTC+05:30)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to IST
      const options = {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navTabs = [
    {
      id: 'dashboard',
      path: '/dashboard',
      labelHi: 'मुख्य पृष्ठ (Dashboard)',
      labelEn: 'Dashboard (Main)',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'complaints',
      path: '/complaints',
      labelHi: 'नागरिक शिकायतें (Grievance Queue)',
      labelEn: 'Grievance Queue',
      icon: FileText,
      badge: { text: isHindi ? '42 लंबित' : '42 Pending', color: 'bg-rose-600 text-white' }
    },
    {
      id: 'map',
      path: '/map',
      labelHi: 'भू-स्थानिक मानचित्र (GIS Map)',
      labelEn: 'GIS Map & Hotspots',
      icon: Map,
      badge: null
    },
    {
      id: 'clusters',
      path: '/clusters',
      labelHi: 'क्लस्टर विश्लेषण (AI Clusters)',
      labelEn: 'AI Clusters',
      icon: Layers,
      badge: { text: 'DBSCAN', color: 'bg-cyan-600 text-white' }
    },
    {
      id: 'admin',
      path: isAdmin ? '/admin' : '/ai-governance',
      labelHi: 'प्रशासन व ऑडिट (AI Governance)',
      labelEn: 'Admin & AI Governance',
      icon: Cpu,
      badge: null
    }
  ];

  return (
    <header className="w-full bg-white select-none z-30 shadow-xs border-b border-slate-200">
      {/* 1. Top Govt of India / UP Gov Accessibility Stripe */}
      <div className="bg-[#0b1320] text-slate-300 text-[11px] border-b border-slate-800">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
          {/* Left Gov Links */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-2.5 rounded-2xs tricolor-stripe shadow-2xs"></span>
              <span className="font-semibold text-slate-200">
                {isHindi ? 'भारत सरकार' : 'Government of India'}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Government of India</span>
            </div>
            <span className="hidden md:inline text-slate-600">•</span>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">
                {isHindi ? 'उत्तर प्रदेश सरकार' : 'Govt. of Uttar Pradesh'}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Govt. of Uttar Pradesh</span>
            </div>
          </div>

          {/* Right Accessibility Controls & Language Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <a 
              href="#main-content" 
              className="text-slate-400 hover:text-white transition-colors underline-offset-2 hover:underline text-[11px] hidden sm:inline"
            >
              Skip to Main Content [मुख्य सामग्री]
            </a>

            {/* Font Resize */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-[10px] font-mono">
              <button 
                onClick={() => changeFontSize(-1)} 
                title="Decrease font size" 
                className="px-1 hover:text-white text-slate-400 font-bold"
              >
                A-
              </button>
              <button 
                onClick={() => changeFontSize(0)} 
                title="Reset font size" 
                className="px-1 hover:text-white text-slate-300 font-bold border-x border-slate-700"
              >
                A
              </button>
              <button 
                onClick={() => changeFontSize(1)} 
                title="Increase font size" 
                className="px-1 hover:text-white text-slate-400 font-bold"
              >
                A+
              </button>
            </div>

            {/* Screen Reader */}
            <button 
              onClick={() => alert(isHindi ? 'स्क्रीन रीडर एक्सेस सक्रिय है (GIGW 3.0 मानक)' : 'Screen Reader access enabled (GIGW 3.0 standard)')}
              className="hidden lg:flex items-center gap-1 text-slate-400 hover:text-white text-[11px]"
              title="Screen Reader Access"
            >
              <Volume2 className="h-3 w-3" />
              <span>Screen Reader</span>
            </button>

            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-0.5 text-[11px] font-medium">
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded-xs transition-colors font-hindi ${
                  language === 'hi' 
                    ? 'bg-blue-600 text-white font-bold shadow-2xs' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-xs transition-colors ${
                  language === 'en' 
                    ? 'bg-blue-600 text-white font-bold shadow-2xs' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Official Portal Masthead */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Ashoka Emblem + Varanasi Nagar Nigam Branding */}
        <div className="flex items-center gap-3.5">
          {/* Ashoka Lion Emblem */}
          <div className="shrink-0 flex items-center justify-center w-12 h-14" title="State Emblem of India">
            <svg viewBox="0 0 100 125" className="w-10 h-14 text-amber-700 drop-shadow-xs fill-current">
              {/* Ashoka Pillar Lion Capital Vector */}
              <path d="M50 5 C43 5 37 10 35 17 C32 16 28 17 26 21 C23 25 24 31 27 34 C25 38 27 44 32 46 C34 50 38 53 43 54 L43 65 C35 66 28 72 27 80 L73 80 C72 72 65 66 57 65 L57 54 C62 53 66 50 68 46 C73 44 75 38 73 34 C76 31 77 25 74 21 C72 17 68 16 65 17 C63 10 57 5 50 5 Z M47 70 L53 70 L53 78 L47 78 Z" opacity="0.85" />
              <circle cx="50" cy="92" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M30 88 L70 88 L75 98 L25 98 Z" />
              <rect x="20" y="100" width="60" height="4" rx="1" />
              <rect x="15" y="106" width="70" height="5" rx="1.5" />
            </svg>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-hindi">
                {isHindi ? 'वाराणसी नगर निगम' : 'VARANASI NAGAR NIGAM'}
              </h1>
              <span className="text-slate-400 font-light hidden sm:inline">|</span>
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase hidden sm:inline">
                VARANASI NAGAR NIGAM
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                ✓ GIGW 3.0 VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium font-hindi mt-0.5">
              {isHindi
                ? 'वाराणसी स्मार्ट सिटी (Varanasi Smart City Ltd.) • एकीकृत नागरिक शिकायत एवं एआई कमान केंद्र (CivicPulse)'
                : 'Varanasi Smart City Ltd. • Integrated Grievance Intelligence & AI Command Operations (CivicPulse)'}
            </p>
          </div>
        </div>

        {/* Right Badges: Swachh Bharat + Smart Cities + Live Clock + IAS Commissioner */}
        <div className="hidden xl:flex items-center gap-4">
          {/* Swachh Bharat Mission Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/60 text-xs">
            {/* Gandhi Spectacles SVG */}
            <svg viewBox="0 0 64 32" className="w-8 h-4 text-emerald-700 fill-current">
              <circle cx="18" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="46" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M28 16 Q32 12 36 16" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M8 14 L2 10 M56 14 L62 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="leading-tight">
              <span className="block font-bold text-slate-800 text-[11px] font-hindi">स्वच्छ भारत मिशन</span>
              <span className="text-[10px] text-emerald-800 font-semibold">Urban 2.0</span>
            </div>
          </div>

          {/* Smart Cities Mission Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 text-xs">
            <Building2 className="h-4 w-4 text-blue-700" />
            <div className="leading-tight">
              <span className="block font-bold text-slate-800 text-[11px]">Smart Cities Mission</span>
              <span className="text-[10px] text-blue-800 font-semibold">MoHUA, GoI</span>
            </div>
          </div>

          {/* Live Clock & Control Center */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs shadow-2xs">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="leading-tight font-mono">
              <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                <span className="text-slate-500 font-sans text-[10px]">UTC+05:30</span>
                <span>{currentTime || '23:13:20'}</span>
                <span className="text-slate-500 text-[10px]">IST</span>
              </div>
              <span className="text-[10px] text-slate-500 font-hindi font-medium">आई कमान, वाराणसी कंट्रोल</span>
            </div>
          </div>

          {/* Commissioner Officer Card with Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left"
              title="Click to view officer details or switch demo role"
            >
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                alt="Dr. Ananya Sharma, IAS"
                className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-2xs"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="leading-tight">
                <span className="block font-bold text-slate-900 text-xs">Dr. Ananya Sharma, IAS</span>
                <span className="text-[10px] text-slate-500 font-hindi">नगर आयुक्त • Municipal Commissioner</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-1" />
            </button>

            {/* Quick Demo Switcher Dropdown */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                <div className="p-2 border-b border-slate-100 text-xs">
                  <p className="font-semibold text-slate-900">Current Session: {user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 capitalize">Role: {user?.role} • {user?.email}</p>
                </div>
                <div className="p-1 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Instant Demo Logins:
                  </div>
                  <button
                    onClick={() => { quickLoginAs('admin'); setRoleDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-indigo-50 font-medium text-slate-700 flex items-center justify-between"
                  >
                    <span>Municipal Commissioner (Admin)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Admin</span>
                  </button>
                  <button
                    onClick={() => { quickLoginAs('officer'); setRoleDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-indigo-50 font-medium text-slate-700 flex items-center justify-between"
                  >
                    <span>Civic Nodal Officer (PWD)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">Officer</span>
                  </button>
                  <button
                    onClick={() => { quickLoginAs('citizen'); setRoleDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-indigo-50 font-medium text-slate-700 flex items-center justify-between"
                  >
                    <span>Registered Citizen</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Citizen</span>
                  </button>
                </div>
                <div className="border-t border-slate-100 p-1">
                  <button
                    onClick={() => { logout(); navigate('/login'); setRoleDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-rose-600 hover:bg-rose-50 text-xs font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* 3. Primary Government Navigation Bar (Deep Navy #0b2545) */}
      <nav className="bg-[#0b2545] text-white">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Main Navigation Links */}
          <div className="hidden xl:flex items-center space-x-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path || (tab.path === '/dashboard' && location.pathname === '/');

              return (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wide transition-all border-b-2 ${
                    isActive
                      ? 'border-amber-400 text-white bg-white/10 shadow-inner'
                      : 'border-transparent text-slate-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-amber-300" />
                  <span className="font-hindi">{isHindi ? tab.labelHi : tab.labelEn}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${tab.badge.color}`}>
                      {tab.badge.text}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Quick Submit Grievance Action */}
          <div className="hidden sm:flex items-center gap-3 py-2">
            <NavLink
              to="/complaints/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-md shadow-xs transition-colors font-hindi"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{isHindi ? '+ नई नागरिक शिकायत दर्ज करें' : '+ Submit New Grievance'}</span>
            </NavLink>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#081a30] border-t border-slate-700/60 p-4 space-y-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium ${
                    isActive ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-amber-300" />
                    <span>{isHindi ? tab.labelHi : tab.labelEn}</span>
                  </div>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab.badge.color}`}>
                      {tab.badge.text}
                    </span>
                  )}
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-slate-700">
              <NavLink
                to="/complaints/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-md"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isHindi ? 'नई नागरिक शिकायत दर्ज करें' : 'Submit New Grievance'}</span>
              </NavLink>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
