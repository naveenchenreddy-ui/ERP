import React from 'react';
import { LogOut, UserCheck, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../common/StatusBadge';

export default function Header() {
  const { user, logout, login, isAdmin } = useAuth();

  const handleSwitchRole = async () => {
    if (isAdmin) {
      await login('sales@erp.com', 'sales123');
    } else {
      await login('admin@erp.com', 'admin123');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-800">
          Enterprise ERP Portal
        </h1>
        <span className="hidden sm:inline-block text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
          Enquiry → Quotation → Sales Order → Reservation → Dispatch
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Role Switcher Button for testing RBAC */}
        <button
          onClick={handleSwitchRole}
          title="Switch between Admin and Sales User to test permissions"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Switch to {isAdmin ? 'Sales User' : 'Admin'}</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
            <div className="text-[11px] text-slate-500">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
