import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import WorkflowStepper from '../components/common/WorkflowStepper';
import {
  FileText,
  FileSpreadsheet,
  ShoppingCart,
  Truck,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading ERP Dashboard...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Customer Enquiries',
      value: stats?.enquiriesCount || 0,
      sub: `${stats?.enquiriesByStatus?.NEW || 0} New, ${stats?.enquiriesByStatus?.QUOTED || 0} Quoted`,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      to: '/enquiries',
    },
    {
      title: 'Quotations',
      value: stats?.quotationsCount || 0,
      sub: `${stats?.quotationsByStatus?.ACCEPTED || 0} Accepted, ${stats?.quotationsByStatus?.DRAFT || 0} Draft`,
      icon: FileSpreadsheet,
      color: 'from-indigo-500 to-purple-500',
      to: '/quotations',
    },
    {
      title: 'Sales Orders',
      value: stats?.ordersCount || 0,
      sub: `${stats?.ordersByStatus?.CONFIRMED || 0} Confirmed, ${stats?.ordersByStatus?.PENDING || 0} Pending`,
      icon: ShoppingCart,
      color: 'from-amber-500 to-orange-500',
      to: '/orders',
    },
    {
      title: 'Dispatches',
      value: stats?.dispatchesCount || 0,
      sub: 'Completed Deliveries',
      icon: Truck,
      color: 'from-emerald-500 to-teal-500',
      to: '/dispatches',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
            <span>Welcome back, {user?.name}</span>
            <span>•</span>
            <span className="uppercase">{user?.role}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Manufacturing & Supply ERP Control
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time tracking of Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/enquiries"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Enquiry</span>
          </Link>
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workflow Stepper Overview */}
      <WorkflowStepper currentStep="order" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.title}
              to={kpi.to}
              className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-sm`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                {kpi.value}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-between">
                <span>{kpi.sub}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Financial & Inventory Alert Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Summary */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Revenue Breakdown
            </h3>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-xs font-semibold text-emerald-800">Confirmed / Dispatched Revenue</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Approved and processed orders</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-xs font-semibold text-amber-800">Pending Orders Pipeline</div>
              <div className="text-xl font-bold text-amber-700 mt-1">
                ₹{(stats?.pendingRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-amber-600 mt-0.5">Awaiting Admin Confirmation</div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                Inventory Stock Alerts ({stats?.lowStockCount || 0} Low Stock)
              </h3>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Manage Stock</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {stats?.lowStockItems?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-xl">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <span>All product inventory levels are healthy and sufficient.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-center">Physical</th>
                    <th className="pb-3 text-center">Reserved</th>
                    <th className="pb-3 text-center">Available</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.lowStockItems?.map((inv) => {
                    const avail = inv.physicalQuantity - inv.reservedQuantity;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-800">
                          <div>{inv.product.productName}</div>
                          <div className="text-xs text-slate-400">{inv.product.productCode}</div>
                        </td>
                        <td className="py-2.5 text-center text-slate-600">{inv.physicalQuantity} {inv.product.unit}</td>
                        <td className="py-2.5 text-center text-amber-600 font-medium">{inv.reservedQuantity}</td>
                        <td className="py-2.5 text-center font-bold text-rose-600">{avail}</td>
                        <td className="py-2.5 text-right">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700">
                            {avail <= 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders and Recent Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Recent Sales Orders
            </h3>
            <Link
              to="/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentOrders?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No orders created yet.</p>
            ) : (
              stats?.recentOrders?.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{ord.orderNumber}</div>
                    <div className="text-xs text-slate-500">{ord.customer?.companyName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">
                      ₹{Number(ord.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <StatusBadge status={ord.status} className="mt-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Dispatches */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Recent Dispatches
            </h3>
            <Link
              to="/dispatches"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentDispatches?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No dispatches created yet.</p>
            ) : (
              stats?.recentDispatches?.map((dsp) => (
                <div
                  key={dsp.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{dsp.dispatchNumber}</div>
                    <div className="text-xs text-slate-500">
                      Order: {dsp.salesOrder?.orderNumber} • {dsp.salesOrder?.customer?.companyName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-600">
                      {new Date(dsp.dispatchDate).toLocaleDateString()}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {dsp.vehicleNumber ? `Veh: ${dsp.vehicleNumber}` : 'Dispatched'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
