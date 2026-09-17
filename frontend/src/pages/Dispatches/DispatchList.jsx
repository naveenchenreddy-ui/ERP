import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import WorkflowStepper from '../../components/common/WorkflowStepper';
import {
  Truck,
  Search,
  Plus,
  Eye,
  Printer,
  Calendar,
  Building2,
  Package,
  AlertCircle,
  RefreshCw,
  User,
  CheckCircle2,
} from 'lucide-react';

export default function DispatchList() {
  const { isAdmin } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Confirmed orders available for dispatch
  const [confirmedOrders, setConfirmedOrders] = useState([]);

  // Create Dispatch modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchItems, setDispatchItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // View Dispatch / Printable Delivery Challan
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dispatches', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
        },
      });
      setDispatches(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConfirmedOrders = async () => {
    try {
      const res = await api.get('/orders', {
        params: { status: 'CONFIRMED', limit: 50 },
      });
      setConfirmedOrders(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [page, search]);

  useEffect(() => {
    loadConfirmedOrders();
    const orderIdParam = searchParams.get('createForOrder');
    if (orderIdParam) {
      handleSelectOrder(orderIdParam);
      setIsCreateOpen(true);
    }
  }, []);

  const handleSelectOrder = async (orderId) => {
    setSelectedOrderId(orderId);
    if (!orderId) {
      setDispatchItems([]);
      return;
    }
    try {
      const res = await api.get(`/orders/${orderId}`);
      const ord = res.data;
      const mapped = ord.items.map((i) => ({
        productId: i.productId,
        productName: i.product?.productName,
        productCode: i.product?.productCode,
        unit: i.product?.unit,
        orderedQuantity: i.quantity,
        quantityDispatched: i.quantity, // default to full shipment
      }));
      setDispatchItems(mapped);
    } catch (err) {
      setFormError('Failed to load order items: ' + err.message);
    }
  };

  const handleItemQtyChange = (index, value) => {
    const updated = [...dispatchItems];
    updated[index].quantityDispatched = parseInt(value, 10) || 0;
    setDispatchItems(updated);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!isAdmin) {
      setFormError('Only Admin users are permitted to process dispatches');
      return;
    }

    if (!selectedOrderId) {
      setFormError('Please select a confirmed sales order');
      return;
    }

    const invalid = dispatchItems.some(
      (i) => i.quantityDispatched <= 0 || i.quantityDispatched > i.orderedQuantity
    );
    if (invalid) {
      setFormError('Dispatch quantity must be between 1 and ordered quantity for each item');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        salesOrderId: parseInt(selectedOrderId, 10),
        dispatchDate: dispatchDate ? new Date(dispatchDate).toISOString() : new Date().toISOString(),
        vehicleNumber: vehicleNumber || undefined,
        driverName: driverName || undefined,
        items: dispatchItems.map((i) => ({
          productId: i.productId,
          quantityDispatched: i.quantityDispatched,
        })),
      };

      await api.post('/dispatches', payload);
      setIsCreateOpen(false);
      setSelectedOrderId('');
      setDispatchItems([]);
      setVehicleNumber('');
      setDriverName('');
      fetchDispatches();
      loadConfirmedOrders();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (dispatchId) => {
    try {
      const res = await api.get(`/dispatches/${dispatchId}`);
      setSelectedDispatch(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Warehouse Dispatches</h1>
          <p className="text-sm text-slate-500">
            Step 5 in ERP Workflow: Final fulfillment, inventory deduction, vehicle logistics, and Delivery Challan generation.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
          disabled={!isAdmin}
          title={!isAdmin ? 'Admin role required to dispatch orders' : ''}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>New Dispatch</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search dispatch # or order #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={fetchDispatches}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <span>Loading dispatches...</span>
          </div>
        ) : dispatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-700">No dispatches recorded</p>
            <p className="text-xs text-slate-400 mt-1">Confirm a sales order to process dispatch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Dispatch #</th>
                  <th className="px-6 py-3.5">Sales Order #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Dispatch Date</th>
                  <th className="px-6 py-3.5">Vehicle / Driver</th>
                  <th className="px-6 py-3.5 text-center">Items</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispatches.map((dsp) => (
                  <tr key={dsp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-emerald-700">
                      {dsp.dispatchNumber}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-indigo-600">
                      {dsp.salesOrder?.orderNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{dsp.salesOrder?.customer?.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {new Date(dsp.dispatchDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      <div>{dsp.vehicleNumber || '—'}</div>
                      <div className="text-[11px] text-slate-400">{dsp.driverName ? `Driver: ${dsp.driverName}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                        {dsp.items?.length || 0} items dispatched
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(dsp.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Delivery Challan</span>
                      </button>
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

      {/* Create Dispatch Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Outbound Dispatch"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {!isAdmin && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Only Admin accounts are authorized to approve and execute dispatches.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Confirmed Sales Order *
              </label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Confirmed Order...</option>
                {confirmedOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNumber} — {ord.customer?.companyName} (₹{ord.totalAmount})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Dispatch Date *
              </label>
              <input
                type="date"
                required
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Vehicle Registration #
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. MH-01-AB-1234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Driver Name / Logistics Carrier
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Ramesh Singh / BlueDart Logistics"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Dispatch Line Items */}
          {dispatchItems.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
                Dispatch Quantities Allocation
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 uppercase border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5 text-center">Ordered Qty</th>
                    <th className="px-4 py-2.5 text-right">Dispatching Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatchItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <div>{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.productCode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                        {item.orderedQuantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="1"
                          max={item.orderedQuantity}
                          required
                          value={item.quantityDispatched}
                          onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                          className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-right font-bold text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || dispatchItems.length === 0 || !isAdmin}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/25 disabled:opacity-50"
            >
              {submitting ? 'Processing Dispatch...' : 'Confirm & Dispatch Shipment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Dispatch / Delivery Challan Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Delivery Challan: ${selectedDispatch?.dispatchNumber || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedDispatch && (
          <div className="space-y-6">
            {/* Stepper */}
            <div className="no-print">
              <WorkflowStepper currentStep="dispatch" />
            </div>

            {/* Printable Delivery Challan Document */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-black text-xl text-slate-900">Apex Manufacturing & Supply</h3>
                  <p className="text-slate-500">100 Industrial Estate, Manufacturing Hub</p>
                  <p className="text-slate-500">Official Goods Delivery Challan</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 font-bold rounded-lg text-sm bg-emerald-100 text-emerald-800 font-mono">
                    {selectedDispatch.dispatchNumber}
                  </span>
                  <div className="mt-2 text-slate-500">
                    Dispatch Date: {new Date(selectedDispatch.dispatchDate).toLocaleDateString()}
                  </div>
                  <div className="text-indigo-600 font-mono font-semibold">
                    SO Ref: {selectedDispatch.salesOrder?.orderNumber}
                  </div>
                </div>
              </div>

              {/* Logistics & Consignee info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold uppercase text-slate-400 block mb-1">Consignee / Deliver To</span>
                  <div className="font-bold text-sm text-slate-800">
                    {selectedDispatch.salesOrder?.customer?.companyName}
                  </div>
                  <div className="text-slate-600">Attn: {selectedDispatch.salesOrder?.customer?.contactPerson}</div>
                  <div className="text-slate-500">Phone: {selectedDispatch.salesOrder?.customer?.mobile}</div>
                  <div className="text-slate-500">Destination: {selectedDispatch.salesOrder?.customer?.city || 'N/A'}</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold uppercase text-slate-400 block mb-1">Logistics Transport Details</span>
                  <div className="text-slate-700">
                    Vehicle Number: <strong className="font-mono text-slate-900">{selectedDispatch.vehicleNumber || 'N/A'}</strong>
                  </div>
                  <div className="text-slate-700 mt-0.5">
                    Driver / Carrier: <strong className="text-slate-900">{selectedDispatch.driverName || 'N/A'}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1">
                    Processed by: {selectedDispatch.createdBy?.name || 'Admin'}
                  </div>
                </div>
              </div>
            </div>

            {/* Dispatched Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Item Code</th>
                    <th className="px-4 py-2.5">Product Description</th>
                    <th className="px-4 py-2.5 text-center">Quantity Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDispatch.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        {item.product?.productCode}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.product?.productName}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-slate-900 text-sm">
                        {item.quantityDispatched} {item.product?.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 pt-12 pb-4 text-xs">
              <div className="text-center border-t border-slate-300 pt-2 text-slate-500">
                Authorized Warehouse Dispatcher Signature
              </div>
              <div className="text-center border-t border-slate-300 pt-2 text-slate-500">
                Receiver / Customer Acknowledgement Signature
              </div>
            </div>

            {/* Actions */}
            <div className="no-print flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Delivery Challan</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
