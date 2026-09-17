import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  FileText,
  FileSpreadsheet,
  ShoppingCart,
  Truck,
  History,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../common/StatusBadge';

export default function Sidebar() {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/enquiries', label: 'Enquiries', icon: FileText },
    { to: '/quotations', label: 'Quotations', icon: FileSpreadsheet },
    { to: '/orders', label: 'Sales Orders', icon: ShoppingCart },
    { to: '/dispatches', label: 'Dispatches', icon: Truck },
    { to: '/inventory/audit', label: 'Audit Trail', icon: History, adminOnly: false },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-tight leading-none">ApexERP</div>
          <div className="text-[11px] text-slate-400 font-medium tracking-wide mt-0.5">Manufacturing & Supply</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Workflow
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Role Banner / Profile Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 uppercase">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge status={user?.role || 'SALES_USER'} className="text-[10px] py-0 px-1.5" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
