import React from 'react';
import { Phone, Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const GovFooter = () => {
  const { isHindi } = useLanguage();

  return (
    <footer className="bg-[#0b1a30] text-slate-300 border-t-4 border-amber-500 font-sans mt-auto">
      {/* 4-Column Gov Information Section */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Col 1: Varanasi Nagar Nigam */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white tracking-wide border-b border-slate-700 pb-2 font-hindi">
              {isHindi ? 'वाराणसी नगर निगम (Varanasi Nagar Nigam)' : 'Varanasi Nagar Nigam (Municipal Corp)'}
            </h3>
            <p className="text-slate-400 leading-relaxed font-hindi">
              सिगरा, वाराणसी - 221002, उत्तर प्रदेश
            </p>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-mono text-slate-300">comm-varanasi@up.gov.in</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 font-hindi">
                    {isHindi ? 'टोल-फ्री नागरिक हेल्पलाइन:' : 'Toll-Free Helpline:'}
                  </span>
                  <span className="font-bold text-white font-mono">1920 / 1800-180-5567</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Useful Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white tracking-wide border-b border-slate-700 pb-2 font-hindi">
              {isHindi ? 'महत्वपूर्ण लिंक (Useful Links)' : 'Useful Government Links'}
            </h3>
            <ul className="space-y-2 font-hindi">
              <li>
                <a 
                  href="https://pgportal.gov.in/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                  <span>राष्ट्रीय जन-शिकायत निवारण पोर्टल (CPGRAMS)</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://e-nagarsewaup.gov.in/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                  <span>उत्तर प्रदेश ई-नगरसेवा पोर्टल</span>
                </a>
              </li>
              <li>
                <span className="text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                  <span>नागरिक अधिकार पत्र (Citizens' Charter)</span>
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                  <span>स्मार्ट सिटी मिशन डैशबोर्ड (MoHUA)</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Policies */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white tracking-wide border-b border-slate-700 pb-2 font-hindi">
              {isHindi ? 'नीति एवं नियम (Policies)' : 'Portal Policies'}
            </h3>
            <ul className="space-y-2 font-hindi">
              <li className="hover:text-amber-300 transition-colors cursor-pointer">
                वेबसाइट नीतियां (Website Policies)
              </li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer">
                गोपनीयता नीति (Privacy Policy)
              </li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer">
                कॉपीराइट नीति (Copyright Policy)
              </li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer">
                हाइपरलिंकिंग नीति (Hyperlinking Policy)
              </li>
            </ul>
          </div>

          {/* Col 4: Design & Technical Management */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white tracking-wide border-b border-slate-700 pb-2 font-hindi">
              {isHindi ? 'डिजाइन एवं तकनीकी प्रबंधन' : 'Design & Technical Management'}
            </h3>
            
            {/* NIC Branding Badge */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-700 text-white font-extrabold text-[10px] tracking-wider">
                  NIC / एनआईसी
                </span>
                <span className="text-[11px] font-semibold text-slate-200">
                  National Informatics Centre
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Ministry of Electronics & Information Technology, Government of India
              </p>
            </div>

            {/* Compliance Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-bold text-[10px] tracking-wider">
                GIGW 2.0 अनुपालन
              </span>
              <span className="px-2 py-1 rounded bg-slate-800 text-amber-400 border border-slate-700 font-bold text-[10px] tracking-wider">
                Digital India
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="bg-[#071120] border-t border-slate-800 text-[11px] text-slate-400 py-3.5">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <p className="font-hindi">
            {isHindi
              ? '© 2026 वाराणसी नगर निगम एवं वाराणसी स्मार्ट सिटी लिमिटेड। सर्वाधिकार सुरक्षित। (Content Managed by Varanasi Municipal Corporation)'
              : '© 2026 Varanasi Nagar Nigam & Varanasi Smart City Ltd. All Rights Reserved. (Content Managed by Varanasi Municipal Corporation)'}
          </p>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
            <span className="font-hindi">अंतिम नवीनीकरण: 24 मई 2026</span>
            <span>•</span>
            <span>पोर्टल संस्करण: v4.2.0-PROD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
