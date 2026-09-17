import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import WorkflowStepper from '../../components/common/WorkflowStepper';
import {
  ShoppingCart,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  Boxes,
  Building2,
  Calendar,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export default function OrderList() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // View Order Details modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [orderStockInfo, setOrderStockInfo] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      setOrders(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter]);

  const handleViewDetails = async (orderId) => {
    try {
      setActionError(null);
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
      setIsDetailOpen(true);

      // Check stock availability for all products in this order
      const stockMap = {};
      await Promise.all(
        res.data.items.map(async (item) => {
          try {
            const invRes = await api.get(`/inventory/${item.productId}`);
            stockMap[item.productId] = invRes.data;
          } catch (e) {
            console.error(e);
          }
        })
      );
      setOrderStockInfo(stockMap);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await api.patch(`/orders/${orderId}/confirm`);
      setSelectedOrder(res.data);
      fetchOrders();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Any reserved inventory will be released.')) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await api.patch(`/orders/${orderId}/cancel`);
      setSelectedOrder(res.data);
      fetchOrders();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchOrder = (order) => {
    setIsDetailOpen(false);
    navigate(`/dispatches?createForOrder=${order.id}`);
  };

  const getStepForOrder = (status) => {
    if (status === 'PENDING') return 'order';
    if (status === 'CONFIRMED') return 'reservation';
    if (status === 'DISPATCHED') return 'dispatch';
    return 'order';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Orders</h1>
          <p className="text-sm text-slate-500">
            Steps 3 & 4 in ERP Workflow: Manage confirmed customer orders and trigger automatic inventory stock reservation.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search order #, quotation #, or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <span>Loading sales orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-700">No sales orders found</p>
            <p className="text-xs text-slate-400 mt-1">Accept a quotation to generate sales orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Order #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Quotation Ref</th>
                  <th className="px-6 py-3.5">Order Date</th>
                  <th className="px-6 py-3.5">Total Value</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-700">
                      {ord.orderNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{ord.customer?.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-mono">
                      {ord.quotation?.quotationNumber || `QT-${ord.quotationId}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {new Date(ord.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ₹{Number(ord.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(ord.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Process</span>
                      </button>

                      {ord.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleDispatchOrder(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={setPage}
        />
      </div>

      {/* View & Process Order Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Sales Order: ${selectedOrder?.orderNumber || ''}`}
        maxWidth="max-w-4xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Stepper */}
            <WorkflowStepper
              currentStep={getStepForOrder(selectedOrder.status)}
              status={selectedOrder.status}
            />

            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Action Blocked</div>
                  <div>{actionError}</div>
                </div>
              </div>
            )}

            {/* Order Overview Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Order Number</span>
                <span className="font-bold text-slate-800 text-sm font-mono">
                  {selectedOrder.orderNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Customer</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {selectedOrder.customer?.companyName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Order Date</span>
                <span className="font-medium text-slate-700">
                  {new Date(selectedOrder.orderDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Current Status</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Inventory Real-Time Availability & Order Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>Ordered Products & Inventory Stock Status</span>
                </h4>
                {selectedOrder.status === 'PENDING' && (
                  <span className="text-[11px] text-slate-500">
                    Confirming order will automatically reserve inventory
                  </span>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5 text-center">Ordered Qty</th>
                      <th className="px-4 py-2.5 text-center">Physical Stock</th>
                      <th className="px-4 py-2.5 text-center">Available Stock</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-center">Stock Feasibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item) => {
                      const inv = orderStockInfo[item.productId];
                      const available = inv ? inv.physicalQuantity - inv.reservedQuantity : 0;
                      const hasSufficientStock = available >= item.quantity;

                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            <div>{item.product?.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.product?.productCode}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-black text-slate-800">
                            {item.quantity} {item.product?.unit}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 font-medium">
                            {inv ? `${inv.physicalQuantity} ${item.product?.unit}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">
                            {inv ? `${available} ${item.product?.unit}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            ₹{Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'DISPATCHED' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                                <ShieldCheck className="w-3 h-3" /> Stock Reserved
                              </span>
                            ) : hasSufficientStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Available to Reserve
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Low Stock Warning
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                  <div className="text-slate-500">
                    {selectedOrder.confirmedBy && (
                      <span>
                        Confirmed by: <strong className="text-slate-700">{selectedOrder.confirmedBy.name}</strong> on{' '}
                        {new Date(selectedOrder.confirmedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 mr-2">Total Order Value:</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DISPATCHED' && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Admin Order Confirmation Button */}
                {selectedOrder.status === 'PENDING' && (
                  <button
                    onClick={() => handleConfirmOrder(selectedOrder.id)}
                    disabled={actionLoading || !isAdmin}
                    title={!isAdmin ? 'Admin role required to confirm orders' : ''}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAdmin ? 'Confirm Order & Reserve Stock' : 'Admin Confirmation Required'}</span>
                  </button>
                )}

                {/* Dispatch Button */}
                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleDispatchOrder(selectedOrder)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/25 transition-all"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Proceed to Dispatch</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
