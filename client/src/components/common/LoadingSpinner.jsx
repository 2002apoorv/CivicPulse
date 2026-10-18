import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = "Loading data...", size = "md" }) => {
  const sizeMap = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-600 mb-2`} />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
};

export const EmptyState = ({ title = "No records found", description = "Try adjusting your filters or search terms.", icon: Icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200">
      {Icon && (
        <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-xl border border-slate-200 w-full ${maxWidth} overflow-hidden transform transition-all`}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
