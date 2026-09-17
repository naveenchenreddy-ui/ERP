import React from 'react';

const statusConfig = {
  // Enquiry
  NEW: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'New' },
  QUOTED: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Quoted' },
  WON: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Won' },
  LOST: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Lost' },

  // Quotation
  DRAFT: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Draft' },
  SENT: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Sent' },
  ACCEPTED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Accepted' },
  REJECTED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rejected' },

  // Order
  PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Confirmation' },
  CONFIRMED: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Confirmed (Stock Reserved)' },
  DISPATCHED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Dispatched' },
  CANCELLED: { bg: 'bg-slate-100 text-slate-600 border-slate-300', label: 'Cancelled' },

  // Roles
  ADMIN: { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Admin' },
  SALES_USER: { bg: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Sales User' },

  // Inventory Action
  RESERVE: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Reserved' },
  RELEASE: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Released' },
  DISPATCH: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Dispatched' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || { bg: 'bg-gray-100 text-gray-700 border-gray-200', label: status };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75" />
      {config.label}
    </span>
  );
}
