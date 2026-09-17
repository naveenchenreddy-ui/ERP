import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import {
  Boxes,
  Search,
  PlusCircle,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Package,
} from 'lucide-react';

export default function InventoryList() {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Inbound Stock Receiving modal
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addQty, setAddQty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Set Physical Quantity modal (Admin only)
  const [isSetStockOpen, setIsSetStockOpen] = useState(false);
  const [setQty, setSetQty] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory', {
        params: { page, limit: 10, search: search || undefined },
      });
      setInventory(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, search]);

  const handleOpenAddStock = (item) => {
    setSelectedProduct(item);
    setAddQty('');
    setFormError(null);
    setIsAddStockOpen(true);
  };

  const handleOpenSetStock = (item) => {
    setSelectedProduct(item);
    setSetQty(String(item.physicalQuantity));
    setFormError(null);
    setIsSetStockOpen(true);
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/inventory/stock', {
        productId: selectedProduct.productId,
        quantity: parseInt(addQty, 10),
      });
      setIsAddStockOpen(false);
      fetchInventory();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetStockSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.put(`/inventory/${selectedProduct.productId}/physical`, {
        quantity: parseInt(setQty, 10),
      });
      setIsSetStockOpen(false);
      fetchInventory();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory & Stock Reservation</h1>
          <p className="text-sm text-slate-500">
            Monitor physical on-hand stock, orders reserved allocation, and available free inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/inventory/audit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-all"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by product code or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={fetchInventory}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <span>Loading inventory records...</span>
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-700">No inventory records</p>
            <p className="text-xs text-slate-400 mt-1">Create products to generate inventory tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5 text-center">Physical Stock</th>
                  <th className="px-6 py-3.5 text-center">Reserved for Orders</th>
                  <th className="px-6 py-3.5 text-center">Available Stock</th>
                  <th className="px-6 py-3.5 text-center">Stock Health</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((inv) => {
                  const avail = inv.physicalQuantity - inv.reservedQuantity;
                  const isLow = avail <= 10 && avail > 0;
                  const isOut = avail <= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div>{inv.product?.productName}</div>
                        <div className="text-xs text-slate-400 font-mono font-normal">
                          {inv.product?.productCode} • {inv.product?.category || 'General'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {inv.physicalQuantity}{' '}
                        <span className="text-xs text-slate-400 font-normal">
                          {inv.product?.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-amber-600">
                        {inv.reservedQuantity}{' '}
                        <span className="text-xs text-slate-400 font-normal">
                          {inv.product?.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-base">
                        <span
                          className={
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {avail}
                        </span>{' '}
                        <span className="text-xs text-slate-400 font-normal">
                          {inv.product?.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Available
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAddStock(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Stock</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleOpenSetStock(inv)}
                            title="Admin Adjustment"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Adjust</span>
                          </button>
                        )}
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
          limit={10}
          onPageChange={setPage}
        />
      </div>

      {/* Inbound Stock Receiving Modal */}
      <Modal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        title={`Receive Inbound Stock: ${selectedProduct?.product?.productName || ''}`}
      >
        <form onSubmit={handleAddStockSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div>
              <span className="font-semibold text-slate-700">Product Code:</span>{' '}
              {selectedProduct?.product?.productCode}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Current Physical Quantity:</span>{' '}
              {selectedProduct?.physicalQuantity} {selectedProduct?.product?.unit}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Current Reserved Quantity:</span>{' '}
              {selectedProduct?.reservedQuantity} {selectedProduct?.product?.unit}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Quantity Received to Add ({selectedProduct?.product?.unit}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddStockOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/25 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Confirm Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Correction Modal (Admin) */}
      <Modal
        isOpen={isSetStockOpen}
        onClose={() => setIsSetStockOpen(false)}
        title={`Admin Inventory Correction: ${selectedProduct?.product?.productName || ''}`}
      >
        <form onSubmit={handleSetStockSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Admin manual override: Setting the physical quantity directly records an audit log adjustment entry.
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Set Exact Physical Quantity *
            </label>
            <input
              type="number"
              min="0"
              required
              value={setQty}
              onChange={(e) => setSetQty(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSetStockOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Set Physical Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
