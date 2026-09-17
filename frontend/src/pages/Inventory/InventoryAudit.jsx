import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import {
  History,
  ArrowLeft,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Clock,
  User,
  Package,
} from 'lucide-react';

export default function InventoryAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/audit', {
        params: { page, limit: 15 },
      });
      setLogs(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/inventory"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Inventory Audit Log</h1>
            <p className="text-sm text-slate-500">
              Immutable ledger of stock reservations, release events, and dispatch adjustments.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <span>Loading audit history...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-700">No audit records yet</p>
            <p className="text-xs text-slate-400 mt-1">Audit log records will appear as orders are confirmed and dispatched.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Log ID</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Action Type</th>
                  <th className="px-6 py-3.5 text-center">Quantity Delta</th>
                  <th className="px-6 py-3.5">Reference Document</th>
                  <th className="px-6 py-3.5">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isPositive = log.quantityChanged > 0;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{log.id}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <div>
                            <div>{log.product?.productName}</div>
                            <div className="text-xs text-slate-400 font-mono font-normal">
                              {log.product?.productCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={log.action} />
                      </td>
                      <td className="px-6 py-4 text-center font-bold font-mono">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'bg-rose-50 text-rose-700 font-bold'
                          }`}
                        >
                          {isPositive ? `+${log.quantityChanged}` : log.quantityChanged}{' '}
                          {log.product?.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs font-mono font-medium">
                        {log.referenceId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.createdBy?.name || 'System'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={15}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
