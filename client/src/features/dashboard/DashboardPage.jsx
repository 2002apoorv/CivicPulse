import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  TrendingUp, 
  Sparkles,
  RefreshCw,
  Building,
  MapPin,
  Download,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Radio,
  FileCheck,
  Check,
  X,
  Send,
  Users,
  Activity,
  Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart, 
  Pie, 
  Cell,
  ReferenceDot,
  Line
} from 'recharts';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { isHindi } = useLanguage();

  // Active time filter tab
  const [activeTimeRange, setActiveTimeRange] = useState('today'); // 'today' | '7days' | 'monthly'

  // Modals state for realistic civic interactive actions
  const [activeModal, setActiveModal] = useState(null); // 'dispatchQRT' | 'barricade' | 'workOrder' | 'dbscan' | 'advisory' | 'pdfReport'
  const [modalSuccessMsg, setModalSuccessMsg] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Inflow vs Resolution curve data (14 days comparative series matching screenshot wave)
  const inflowVelocityData = [
    { day: isHindi ? 'दिवस 1 (10 मई)' : 'Day 1 (May 10)', inflow: 820, resolved: 780 },
    { day: isHindi ? 'दिवस 2' : 'Day 2', inflow: 890, resolved: 810 },
    { day: isHindi ? 'दिवस 3' : 'Day 3', inflow: 910, resolved: 870 },
    { day: isHindi ? 'दिवस 4' : 'Day 4', inflow: 760, resolved: 890 },
    { day: isHindi ? 'दिवस 5' : 'Day 5', inflow: 710, resolved: 920 },
    { day: isHindi ? 'दिवस 6' : 'Day 6', inflow: 680, resolved: 900 },
    { day: isHindi ? 'दिवस 7' : 'Day 7', inflow: 740, resolved: 860 },
    { day: isHindi ? 'दिवस 8' : 'Day 8', inflow: 940, resolved: 840 },
    { day: isHindi ? 'दिवस 9' : 'Day 9', inflow: 1180, resolved: 820 },
    { day: isHindi ? 'दिवस 10 (उफान घटना)' : 'Day 10 (Surge Event)', inflow: 1420, resolved: 790 },
    { day: isHindi ? 'दिवस 11' : 'Day 11', inflow: 1210, resolved: 890 },
    { day: isHindi ? 'दिवस 12' : 'Day 12', inflow: 960, resolved: 980 },
    { day: isHindi ? 'दिवस 13' : 'Day 13', inflow: 890, resolved: 1040 },
    { day: isHindi ? 'आज (24 मई)' : 'Today (May 24)', inflow: 1063, resolved: 1014 }
  ];

  // Category Donut Distribution Data matching screenshot exactly
  const categoryData = [
    { 
      name: isHindi ? 'सड़क एवं गड्ढे (Roads & Potholes)' : 'Roads & Potholes', 
      shortName: 'Roads',
      percentage: 28, 
      count: '4,170', 
      color: '#f97316' 
    },
    { 
      name: isHindi ? 'जल आपूर्ति (Water Supply)' : 'Water Supply', 
      shortName: 'Water',
      percentage: 24, 
      count: '3,574', 
      color: '#0ea5e9' 
    },
    { 
      name: isHindi ? 'ठोस अपशिष्ट प्रबंधन (Solid Waste)' : 'Solid Waste', 
      shortName: 'Waste',
      percentage: 22, 
      count: '3,276', 
      color: '#10b981' 
    },
    { 
      name: isHindi ? 'मार्ग प्रकाश (Street Lighting)' : 'Street Lighting', 
      shortName: 'Lighting',
      percentage: 14, 
      count: '2,084', 
      color: '#eab308' 
    },
    { 
      name: isHindi ? 'जल निकासी व नाले (Drainage)' : 'Drainage & Sewage', 
      shortName: 'Drainage',
      percentage: 12, 
      count: '1,787', 
      color: '#0f766e' 
    }
  ];

  // Department Workload Table Data
  const departmentWorkload = [
    {
      id: 1,
      nameHi: 'जल संस्थान (Jal Sansthan)',
      nameEn: 'Jal Sansthan (Water & Sewage)',
      descHi: 'पेयजल आपूर्ति एवं सीवरेज तंत्र',
      descEn: 'Drinking Water Supply & Sewerage',
      pendingCount: 89,
      subTagHi: '18 उच्च प्राथमिकता',
      subTagEn: '18 High Priority',
      subTagColor: 'text-amber-700 font-semibold',
      avgTat: '14.2 घंटे',
      avgTatEn: '14.2 hrs',
      slaPercent: 94.8,
      slaColor: 'bg-emerald-500',
      officerHi: 'इंजी. आर. के. मिश्रा',
      officerEn: 'Er. R. K. Mishra',
      designationHi: 'अधीक्षण अभियंता, जोन-2',
      designationEn: 'Superintending Engineer, Zone-2',
      statusHi: 'संतोषजनक',
      statusEn: 'Satisfactory',
      statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-300'
    },
    {
      id: 2,
      nameHi: 'लोक निर्माण विभाग (PWD)',
      nameEn: 'Public Works Department (PWD)',
      descHi: 'सड़क, सेतु एवं कोरोगेटेड फुटपाथ',
      descEn: 'Roads, Bridges & Footpaths',
      pendingCount: 142,
      subTagHi: '32 आपदा संकट',
      subTagEn: '32 Hazard Critical',
      subTagColor: 'text-rose-700 font-bold',
      avgTat: '26.1 घंटे',
      avgTatEn: '26.1 hrs',
      slaPercent: 81.4,
      slaColor: 'bg-rose-500',
      officerHi: 'विश्वजीत सिंह',
      officerEn: 'Vishwajeet Singh',
      designationHi: 'मुख्य अभियंता (सड़क)',
      designationEn: 'Chief Engineer (Roads)',
      statusHi: 'विलंबित',
      statusEn: 'Delayed',
      statusBadge: 'bg-rose-50 text-rose-700 border-rose-300'
    },
    {
      id: 3,
      nameHi: 'नगर निगम स्वच्छता प्रभाग',
      nameEn: 'Municipal Sanitation Division',
      descHi: 'ठोस अपशिष्ट एवं घाट सफाई यूनिट',
      descEn: 'Solid Waste & Ghat Cleaning Unit',
      pendingCount: 151,
      subTagHi: 'डोर-टू-डोर समस्या',
      subTagEn: 'Door-to-door collection issue',
      subTagColor: 'text-slate-600',
      avgTat: '11.8 घंटे',
      avgTatEn: '11.8 hrs',
      slaPercent: 96.2,
      slaColor: 'bg-emerald-500',
      officerHi: 'आलोक चौरसिया',
      officerEn: 'Alok Chaurasia',
      designationHi: 'अपर नगर स्वास्थ्य अधिकारी',
      designationEn: 'Addl. Municipal Health Officer',
      statusHi: 'उत्कृष्ट',
      statusEn: 'Excellent',
      statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-300'
    },
    {
      id: 4,
      nameHi: 'पूर्वांचल विद्युत वितरण (PVVNL)',
      nameEn: 'Purvanchal Vidyut Vitaran (PVVNL)',
      descHi: 'विद्युत संरचना व विद्युत सुरक्षा',
      descEn: 'Power Infrastructure & Public Safety',
      pendingCount: 29,
      subTagHi: '4 ट्रांसफार्मर सुधार',
      subTagEn: '4 Transformer Repairs',
      subTagColor: 'text-slate-600',
      avgTat: '8.4 घंटे',
      avgTatEn: '8.4 hrs',
      slaPercent: 98.1,
      slaColor: 'bg-emerald-500',
      officerHi: 'सौरभ तिवारी',
      officerEn: 'Saurabh Tiwari',
      designationHi: 'अधिशासी अभियंता (वितरण)',
      designationEn: 'Executive Engineer (Distribution)',
      statusHi: 'उत्कृष्ट',
      statusEn: 'Excellent',
      statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-300'
    },
    {
      id: 5,
      nameHi: 'यातायात एवं अतिक्रमण प्रकोष्ठ',
      nameEn: 'Traffic & Anti-Encroachment Cell',
      descHi: 'स्मार्ट सिग्नल एवं पार्किंग व्यवस्था',
      descEn: 'Smart Signals & Corridor Mobility',
      pendingCount: 17,
      subTagHi: 'सिग्नल सिंक्रोनाइजेशन',
      subTagEn: 'Signal Synchronization',
      subTagColor: 'text-slate-600',
      avgTat: '6.1 घंटे',
      avgTatEn: '6.1 hrs',
      slaPercent: 99.0,
      slaColor: 'bg-emerald-500',
      officerHi: 'एसीपी मनीष राव',
      officerEn: 'ACP Manish Rao',
      designationHi: 'यातायात कमान नियंत्रण',
      designationEn: 'Traffic Command & Control',
      statusHi: 'उत्कृष्ट',
      statusEn: 'Excellent',
      statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-300'
    }
  ];

  // Handle action submission
  const executeAction = (actionName) => {
    setIsProcessingAction(true);
    setTimeout(() => {
      setIsProcessingAction(false);
      setModalSuccessMsg(`कार्रवाई सफलतापूर्वक प्रेषित: ${actionName}`);
      setTimeout(() => {
        setActiveModal(null);
        setModalSuccessMsg('');
      }, 1600);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Live Telemetry Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title & Status */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-indigo-200 border border-slate-700">
                ZONE - ALPHA • AI TELEMETRY
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-hindi">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-700">
                  {isHindi ? 'सक्रिय इंजन: Live DBSCAN + TF-IDF (99.8% Uptime)' : 'Active Engine: Live DBSCAN + TF-IDF (99.8% Uptime)'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">
                  {isHindi ? 'वास्तविक डेटा अद्यतन: प्रत्येक 15 सेकंड' : 'Live Data Refresh: Every 15s'}
                </span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-hindi">
              {isHindi 
                ? 'नागरीय परिचालन एवं जन-शिकायत कमान डैशबोर्ड (Varanasi Urban Operations Hub)'
                : 'Urban Operations & Grievance Command Dashboard (Varanasi Urban Operations Hub)'}
            </h2>
            <p className="text-xs text-slate-600 font-medium font-hindi">
              {isHindi
                ? 'नागरिक चार्टर एवं स्वचालित समस्या क्लस्टरिंग प्रणाली • वाराणसी स्मार्ट सिटी मिशन'
                : 'Citizen Charter SLA Compliance & Automated Grievance Clustering • Varanasi Smart City Mission'}
            </p>
          </div>

          {/* Right Action Controls: Time Filter Pills & PDF Download */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Time Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold font-hindi">
              <button
                onClick={() => setActiveTimeRange('today')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTimeRange === 'today'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHindi ? 'आज (Today)' : 'Today'}
              </button>
              <button
                onClick={() => setActiveTimeRange('7days')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTimeRange === '7days'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHindi ? 'विगत 7 दिवस' : 'Past 7 Days'}
              </button>
              <button
                onClick={() => setActiveTimeRange('monthly')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTimeRange === 'monthly'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHindi ? 'मासिक संचयी' : 'Monthly Cumulative'}
              </button>
            </div>

            {/* Official Report Download Button */}
            <button
              onClick={() => setActiveModal('pdfReport')}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#0b2545] hover:bg-[#071930] text-white rounded-lg text-xs font-bold tracking-wide transition-all shadow-xs font-hindi"
            >
              <Download className="h-3.5 w-3.5 text-amber-300" />
              <span>{isHindi ? 'आधिकारिक रिपोर्ट डाउनलोड (PDF)' : 'Download Official PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 6 KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Registered Complaints */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 font-hindi font-medium">
            <span>{isHindi ? 'कुल पंजीकृत शिकायतें' : 'Total Complaints'}</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              14,892
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
              <span>▲ +12.4%</span>
              <span className="font-normal text-slate-500 font-hindi text-[10px]">
                {isHindi ? 'पिछले सप्ताह की तुलना' : 'vs last week'}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-hindi">
            <span>डिजिटल पोर्टल: <strong className="text-slate-700">68%</strong></span>
            <span>1920 टोल-फ्री: <strong className="text-slate-700">32%</strong></span>
          </div>
        </div>

        {/* Card 2: Backlog Pending Tickets */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 font-hindi font-medium">
            <span>{isHindi ? 'लंबित मामले (BACKLOG)' : 'Active Backlog'}</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              382
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
              <span>▼ -8.1%</span>
              <span className="font-normal text-slate-500 font-hindi text-[10px]">
                {isHindi ? 'निवारण में तेजी' : 'faster resolution'}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-hindi">
            <span>जल: <strong className="text-slate-700">69</strong></span>
            <span>PWD: <strong className="text-slate-700">142</strong></span>
            <span>सफाई: <strong className="text-slate-700">151</strong></span>
          </div>
        </div>

        {/* Card 3: Average Resolution Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 font-hindi font-medium">
            <span>{isHindi ? 'औसत समाधान समय' : 'Average TAT'}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              SLA &lt;24h
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-1">
              <span>18.4</span>
              <span className="text-xs font-bold text-slate-500 uppercase">घंटे (HRS)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5 font-hindi">
              <span>✓ नागरिक चार्टर अनुकूलन</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '76%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 4: Resolution Rate % */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 font-hindi font-medium">
            <span>{isHindi ? 'समाधान दर (RATE)' : 'Resolution Rate'}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              92.6%
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
              <span>▲ +3.2%</span>
              <span className="font-normal text-slate-500 font-hindi text-[10px]">
                {isHindi ? 'निर्धारित लक्ष्य से' : 'above target'}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92.6%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 5: Critical Hazard Emergencies (Red alert theme) */}
        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between text-xs text-rose-900 font-hindi font-bold">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              {isHindi ? 'अति-संवेदनशील आपदाएं' : 'Critical Emergencies'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 font-hindi">
              तत्काल कार्रवाई
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tracking-tight">
              7
            </div>
            <div className="text-[11px] font-bold text-rose-700 mt-0.5 font-hindi truncate">
              विद्युत 11kV लाइन • मुख्य ड्रेन लाइन...
            </div>
          </div>
          <div className="pt-2 border-t border-rose-100">
            <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-600 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 6: AI Clusters (DBSCAN) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <div className="flex items-center justify-between text-xs text-slate-600 font-hindi font-medium">
            <span>{isHindi ? 'एआई क्लस्टर (DBSCAN)' : 'AI Clusters'}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
              एआई सक्रिय
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              23
            </div>
            <div className="text-[11px] font-semibold text-indigo-700 mt-0.5 font-hindi">
              14 प्राथमिक / 9 पुनः क्लस्टर
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid (Left 66%, Right 34%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ===================== LEFT COLUMN (8 COLS) ===================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Box 1: Grievance Inflow vs Resolution Velocity (Area Chart) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            {/* Header + Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-hindi">
                  {isHindi 
                    ? 'दैनिक शिकायत आवक बनाम निवारण गति (Grievance Inflow vs Resolution Velocity)' 
                    : 'Daily Grievance Inflow vs Resolution Velocity'}
                </h3>
                <p className="text-xs text-slate-500 font-hindi">
                  {isHindi
                    ? 'नागरिकों द्वारा दर्ज नई समस्याओं और नगर निगम द्वारा निस्तारित मामलों का 14-दिवसीय तुलनात्मक ग्राफ'
                    : '14-day comparative trajectory of citizen inflow vs municipal clearance velocity'}
                </p>
              </div>

              {/* Legend matching screenshot */}
              <div className="flex items-center gap-4 text-xs font-semibold shrink-0 font-hindi">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  {isHindi ? 'नई आवक (Inflow)' : 'New Inflow'}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {isHindi ? 'निस्तारित (Resolved)' : 'Resolved'}
                </span>
              </div>
            </div>

            {/* In-Chart Yellow Surge Alert Box */}
            <div className="my-3.5 p-3 rounded-lg bg-amber-50 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-hindi">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  {isHindi
                    ? 'वार्ड 14 (सिगरा) में जलभराव की शिकायत में असामान्य वृद्धि दर्ज (+310% विचलन)'
                    : 'Abnormal grievance surge detected in Ward 14 (Sigra) (+310% deviation in water-logging)'}
                </span>
              </div>
              <button
                onClick={() => setActiveModal('dispatchQRT')}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs shrink-0 transition-colors shadow-2xs"
              >
                {isHindi ? 'त्वरित दल भेजें' : 'Dispatch QRT'}
              </button>
            </div>

            {/* Recharts Area Spline Wave */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={inflowVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '0.5rem', 
                      color: '#fff',
                      fontSize: '11px' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inflow" 
                    name={isHindi ? 'नई आवक (Inflow)' : 'Inflow'} 
                    stroke="#0284c7" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#inflowGrad)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="resolved" 
                    name={isHindi ? 'निस्तारित (Resolved)' : 'Resolved'} 
                    stroke="#059669" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#resolvedGrad)" 
                  />
                  {/* Highlight Surge Inflection Point on Day 10 */}
                  <ReferenceDot 
                    x={isHindi ? 'दिवस 10 (उफान घटना)' : 'Day 10 (Surge Event)'} 
                    y={1420} 
                    r={6} 
                    fill="#e11d48" 
                    stroke="#ffffff" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom 3-Column Velocity Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center font-hindi">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="block text-[11px] text-slate-500 font-medium">
                  {isHindi ? 'औसत दैनिक आवक' : 'Avg Daily Inflow'}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                  1,063 {isHindi ? 'शिकायतें' : 'tickets'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="block text-[11px] text-slate-500 font-medium">
                  {isHindi ? 'औसत दैनिक निवारण' : 'Avg Daily Clearance'}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                  1,014 {isHindi ? 'मामले' : 'resolved'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="block text-[11px] text-slate-500 font-medium">
                  {isHindi ? 'निवल गति (Net Velocity)' : 'Net Velocity'}
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
                  +49/{isHindi ? 'दिन' : 'day'}
                </span>
              </div>
            </div>
          </div>

          {/* Box 2: Department Workload & Citizen Charter (SLA) Compliance Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-hindi">
                  {isHindi
                    ? 'विभागीय कार्यभार एवं नागरिक अधिकार पत्र (SLA) अनुपालन'
                    : 'Department Workload & Citizen Charter SLA Compliance'}
                </h3>
                <p className="text-xs text-slate-500 font-hindi">
                  {isHindi
                    ? 'वाराणसी नगर निगम एवं संबद्ध एजेंसियों की वास्तविक समय कार्यप्रणाली'
                    : 'Real-time performance tracking of municipal departments and agencies'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 font-hindi">
                5 प्रशासनिक इकाइयां सक्रिय
              </span>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 font-hindi">
                    <th className="py-2.5 px-3">विभाग (DEPARTMENT)</th>
                    <th className="py-2.5 px-3">लंबित मामले (PENDING)</th>
                    <th className="py-2.5 px-3">औसत समय (AVG TAT)</th>
                    <th className="py-2.5 px-3">SLA अनुपालन (SLA %)</th>
                    <th className="py-2.5 px-3">नोडल अधिकारी (NODAL OFFICER)</th>
                    <th className="py-2.5 px-3">स्थिति (STATUS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-hindi">
                  {departmentWorkload.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Department Name & Subtitle */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">
                          {isHindi ? dept.nameHi : dept.nameEn}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {isHindi ? dept.descHi : dept.descEn}
                        </span>
                      </td>

                      {/* Pending Count + Subtag */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {dept.pendingCount}
                        </div>
                        <span className={`text-[10px] block ${dept.subTagColor}`}>
                          {isHindi ? dept.subTagHi : dept.subTagEn}
                        </span>
                      </td>

                      {/* Avg Resolution TAT */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {isHindi ? dept.avgTat : dept.avgTatEn}
                      </td>

                      {/* SLA Compliance % with Bar */}
                      <td className="py-3 px-3 w-36">
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 mb-1">
                          <span>{dept.slaPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${dept.slaColor} rounded-full`} 
                            style={{ width: `${dept.slaPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Nodal Officer & Role */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">
                          {isHindi ? dept.officerHi : dept.officerEn}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {isHindi ? dept.designationHi : dept.designationEn}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${dept.statusBadge}`}>
                          {isHindi ? dept.statusHi : dept.statusEn}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT COLUMN (4 COLS) ===================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: AI Automated Alerts & Insights */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-hindi">
                  {isHindi ? 'एआई स्वचालित अलर्ट एवं अंतर्दृष्टि (AI Alerts)' : 'AI Automated Alerts & Insights'}
                </h3>
                <p className="text-[11px] text-slate-500 font-hindi">
                  भाषा मॉडल: spaCy v3.7 • विसंगति अभिज्ञान इंजन
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 font-hindi">
                प्राथमिकता: 1
              </span>
            </div>

            {/* 3 Real-time Alert Items matching screenshot */}
            <div className="mt-3.5 space-y-3 font-hindi">
              {/* Alert 1: Unusual Surge in Ward 14 */}
              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>असामान्य वृद्धि चेतावनी</span>
                  </div>
                  <span className="text-[10px] text-slate-500">12 मिनट पूर्व</span>
                </div>
                <p className="text-xs text-slate-800 leading-snug">
                  <strong>वार्ड 14 (सिगरा):</strong> विगत 4 घंटों में आवासीय बेसमेंट में सीवर बैकफ्लो की 41 शिकायतें दर्ज की गईं।
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
                  <span className="text-slate-600 font-semibold">एआई सटीकता: <strong className="text-slate-900">98.2%</strong></span>
                  <button
                    onClick={() => setActiveModal('workOrder')}
                    className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-0.5"
                  >
                    कार्य आदेश जारी करें →
                  </button>
                </div>
              </div>

              {/* Alert 2: Critical Safety Hazard at Dashashwamedh Ghat */}
              <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <span>अति-संवेदनशील सुरक्षा खतरा</span>
                  </div>
                  <span className="text-[10px] text-slate-500">24 मिनट पूर्व</span>
                </div>
                <p className="text-xs text-slate-800 leading-snug">
                  <strong>दशाश्वमेध घाट</strong> पैदल मार्ग के समीप गहरा खुला मैनहोल रिपोर्ट। आपदा स्कोर: <strong className="text-rose-700 font-mono">94/100</strong>।
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 text-[11px]">
                  <span className="text-slate-600 font-semibold font-mono">मॉडल: HazardX-v2</span>
                  <button
                    onClick={() => setActiveModal('barricade')}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-2xs transition-colors"
                  >
                    तत्काल बैरिकेडिंग आदेश
                  </button>
                </div>
              </div>

              {/* Alert 3: Duplicate Problem Clustering at Assi Ghat */}
              <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                    <span>डुप्लिकेट समस्या समूहीकरण</span>
                  </div>
                  <span className="text-[10px] text-slate-500">48 मिनट पूर्व</span>
                </div>
                <p className="text-xs text-slate-800 leading-snug">
                  <strong>अस्सी घाट</strong> पर मुख्य पेयजल पाइपलाइन फटने से जुड़ी 12 भिन्न नागरिक रिपोर्टों को क्लस्टर टिकट <span className="font-mono font-bold text-blue-700">#JS-6821</span> में समाहित किया गया।
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 text-[11px]">
                  <span className="text-slate-600 font-semibold font-mono">समानता स्कोर: <strong>0.91</strong></span>
                  <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    11 समन्वयक फील्ड विजिट रोकें गए
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Category Distribution (Donut Chart + Corridor Callout) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-hindi">
                  {isHindi ? 'श्रेणीवार शिकायत वितरण (Category Distribution)' : 'Category Distribution'}
                </h3>
                <p className="text-[11px] text-slate-500 font-hindi">
                  14,892 अभिलेखित समस्याओं का विषयवार वर्गीकरण
                </p>
              </div>
              <button 
                onClick={() => alert("डाटा अद्यतन किया गया (Data refreshed)")}
                title="Refresh Distribution" 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Donut Chart + Right Legend */}
            <div className="flex flex-col sm:flex-row items-center gap-4 my-3">
              {/* Donut with Center Text */}
              <div className="h-40 w-40 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="percentage"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text matching screenshot */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900 font-mono">5</span>
                  <span className="text-[9px] text-slate-500 font-hindi font-bold">मुख्य वर्ग</span>
                </div>
              </div>

              {/* Right Legend matching screenshot exactly */}
              <div className="flex-1 space-y-1.5 text-xs font-hindi w-full">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {item.percentage}% • {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Corridor Callout Box */}
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs font-hindi">
              <div className="flex items-center gap-2 text-slate-800">
                <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-slate-900 block">गोदौलिया - चौक कॉरिडोर (सघन केंद्र)</span>
                  <span className="text-[10px] text-slate-500">पुनरावृत्त शिकायतों का प्रमुख केंद्र • विशेष निरीक्षण दल तैनात</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/map')}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-800 font-bold text-xs shrink-0 transition-colors shadow-2xs"
              >
                मानचित्र पर देखें
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Rapid Administrative Console (Rapid Response Console) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Console Title */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="font-hindi">
              <span className="font-bold text-slate-900 text-sm">
                त्वरित प्रशासनिक परिचालन कंसोल (Rapid Response Console)
              </span>
              <span className="text-slate-400 mx-2 hidden sm:inline">|</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                प्राधिकृत: नगर आयुक्त विशेष विशेषाधिकार
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 font-hindi text-xs">
            <button
              onClick={() => setActiveModal('dbscan')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
              <span>DBSCAN क्लस्टर पुनर्गणना</span>
            </button>

            <button
              onClick={() => setActiveModal('advisory')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-300 transition-colors"
            >
              <Radio className="h-3.5 w-3.5 text-amber-700" />
              <span>वार्ड जल परामर्श जारी करें</span>
            </button>

            <button
              onClick={() => navigate('/ai-governance')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors shadow-2xs"
            >
              <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>मानव सत्यापन ऑडिट</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== INTERACTIVE MODALS ===================== */}

      {/* 1. Modal: Dispatch QRT for Ward 14 */}
      {activeModal === 'dispatchQRT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 font-hindi">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                त्वरित प्रतिक्रिया दल (QRT) प्रेषण
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-700">
                <strong>स्थान:</strong> वार्ड 14, सिगरा आवासीय क्षेत्र, वाराणसी
              </p>
              <p className="text-slate-700">
                <strong>समस्या:</strong> सीवर बैकफ्लो असामान्य वृद्धि (+310% विचलन)
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border text-slate-600 space-y-1">
                <span className="block font-semibold text-slate-800">तैनात की जाने वाली टीम:</span>
                <span>• जल संस्थान आपातकालीन सुपर-सक्शन यूनिट #04</span>
                <span>• 2 कनिष्ठ अभियंता एवं 6 सफाई कर्मचारी</span>
              </div>
            </div>
            {modalSuccessMsg ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded font-bold text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                {modalSuccessMsg}
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => executeAction('वार्ड 14 QRT दल रवाना किया गया')}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow-xs"
                >
                  {isProcessingAction ? 'प्रेषित हो रहा है...' : 'पुष्टि करें और दल भेजें'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Modal: Barricading Order for Dashashwamedh Ghat */}
      {activeModal === 'barricade' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 font-hindi">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                तत्काल सुरक्षा बैरिकेडिंग आदेश
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                <strong>चेतावनी:</strong> दशाश्वमेध घाट पैदल मार्ग के समीप गहरा खुला मैनहोल रिपोर्ट हुआ है। आपदा स्कोर: 94/100 (अति-संवेदनशील)।
              </div>
              <p className="text-slate-700">
                आदेश प्रेषित किया जाएगा: <strong>पीडब्ल्यूडी रोड सेफ्टी विंग</strong> एवं <strong>स्थानीय यातायात पुलिस</strong> को तत्काल बैरिकेडिंग व रिफ्लेक्टिव कोन लगाने हेतु।
              </p>
            </div>
            {modalSuccessMsg ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded font-bold text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                {modalSuccessMsg}
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => executeAction('तत्काल बैरिकेडिंग आदेश जारी')}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow-xs"
                >
                  {isProcessingAction ? 'आदेश जारी हो रहा है...' : 'तत्काल आदेश जारी करें'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Modal: Work Order Dispatch */}
      {activeModal === 'workOrder' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 font-hindi">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                डिजिटल कार्य आदेश (Work Order #WO-2026-904)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-700">
                <strong>संबंधित विभाग:</strong> जल संस्थान (पेयजल एवं सीवरेज)
              </p>
              <p className="text-slate-700">
                <strong>कार्य विवरण:</strong> वार्ड 14 के आवासीय बेसमेंट में सीवर रुकावट को डी-सिल्टिंग मशीन द्वारा तत्काल हटाना।
              </p>
              <p className="text-slate-700">
                <strong>निर्धारित SLA:</strong> 6 घंटे के भीतर निस्तारण
              </p>
            </div>
            {modalSuccessMsg ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded font-bold text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                {modalSuccessMsg}
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => executeAction('कार्य आदेश #WO-2026-904 अधिकृत')}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow-xs"
                >
                  {isProcessingAction ? 'सत्यापन हो रहा है...' : 'कार्य आदेश जारी करें'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Modal: DBSCAN Cluster Recomputation */}
      {activeModal === 'dbscan' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 font-hindi">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-indigo-600" />
                DBSCAN क्लस्टर पुनर्गणना प्रारंभ करें
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <p>
                यह प्रक्रिया सभी 14,892 सक्रिय नागरिक शिकायतों को 384-आयामी एम्बेडिंग और स्थानिक दूरी (&lt;800m) के आधार पर पुनः समूहीकृत करेगी।
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border text-slate-600 font-mono text-[11px] space-y-1">
                <div>Model: all-MiniLM-L6-v2</div>
                <div>Spatial Radius: 500m</div>
                <div>Cosine Distance Threshold: 0.35</div>
              </div>
            </div>
            {modalSuccessMsg ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded font-bold text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                {modalSuccessMsg}
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => executeAction('DBSCAN क्लस्टरिंग पूर्ण: 23 क्लस्टर अद्यतन')}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow-xs"
                >
                  {isProcessingAction ? 'क्लस्टरिंग गणना जारी...' : 'पुनर्गणना निष्पादित करें'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Modal: Ward Water Advisory Broadcast */}
      {activeModal === 'advisory' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 font-hindi">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
                <Radio className="h-5 w-5 text-amber-600" />
                नागरिक जल परामर्श अधिसूचना (SMS & Portal)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <p>
                <strong>लक्षित क्षेत्र:</strong> वार्ड 14 (सिगरा) एवं अस्सी घाट परिधि
              </p>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                "नागरिकों को सूचित किया जाता है कि पाइपलाइन मरम्मत कार्य के चलते आज सायं 4 से 7 बजे तक जलापूर्ति प्रभावित रह सकती है। जल टैंकर हेल्पलाइन 1920 पर उपलब्ध हैं।"
              </div>
            </div>
            {modalSuccessMsg ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded font-bold text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                {modalSuccessMsg}
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => executeAction('जल परामर्श नागरिकों को प्रसारित')}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow-xs"
                >
                  {isProcessingAction ? 'प्रसारण हो रहा है...' : 'परामर्श प्रसारित करें'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Modal: Official PDF Municipal Report */}
      {activeModal === 'pdfReport' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 font-hindi max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  वाराणसी नगर निगम • आधिकारिक दैनिक परिचालन बुलेटिन
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Doc Ref: VNN-OPS-2026-0524</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-800 p-4 bg-slate-50 rounded-lg border">
              <div className="flex justify-between border-b pb-2">
                <span><strong>दिनांक:</strong> 24 मई 2026</span>
                <span><strong>रिपोर्टिंग अधिकारी:</strong> डॉ. अनन्य शर्मा, आईएएस (नगर आयुक्त)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-slate-500">कुल दर्ज शिकायतें:</span>
                  <span className="font-bold text-sm font-mono">14,892</span>
                </div>
                <div>
                  <span className="block text-slate-500">सक्रिय बैकलॉग:</span>
                  <span className="font-bold text-sm font-mono">382</span>
                </div>
                <div>
                  <span className="block text-slate-500">समग्र समाधान दर:</span>
                  <span className="font-bold text-sm text-emerald-700 font-mono">92.6%</span>
                </div>
                <div>
                  <span className="block text-slate-500">औसत समाधान समय:</span>
                  <span className="font-bold text-sm font-mono">18.4 घंटे</span>
                </div>
              </div>
              <div className="pt-2 border-t text-[11px] text-slate-600">
                <strong>विशेष टिप्पणी:</strong> वार्ड 14 (सिगरा) में सीवर बैकफ्लो समस्या पर त्वरित प्रतिक्रिया दल तैनात। गोदौलिया - चौक कॉरिडोर में गहन निरीक्षण जारी।
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                प्रिंट करें
              </button>
              <button
                onClick={() => {
                  alert("पीडीएफ डाउनलोड तैयार है (PDF Generated)");
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[#0b2545] hover:bg-[#071930] text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Download className="h-4 w-4 text-amber-300" />
                डाउनलोड करें (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
