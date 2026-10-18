import React from 'react';
import { Outlet } from 'react-router-dom';
import { GovHeader } from './GovHeader';
import { GovFooter } from './GovFooter';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Official Government of India & Varanasi Nagar Nigam Masthead & Navigation */}
      <GovHeader />

      {/* Main Page Body Container */}
      <main id="main-content" className="flex-1 max-w-[1560px] w-full mx-auto px-4 sm:px-6 py-6 focus:outline-none">
        <Outlet />
      </main>

      {/* Official Government Footer */}
      <GovFooter />
    </div>
  );
};
