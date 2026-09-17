import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import WorkflowStepper from '../../components/common/WorkflowStepper';
import {
  FileText,
  Search,
  Plus,
  Eye,
  ArrowRight,
  PlusCircle,
  Trash2,
  Calendar,
  Building2,
  Package,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

export default function EnquiryList() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Reference data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Create Enquiry Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [enquiryDate, setEnquiryDate] = useState(new Date().toISOString().split('T')[0]);
  const [requiredDate, setRequiredDate] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, notes: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // View Enquiry Detail Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enquiries', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      setEnquiries(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers', { params: { limit: 100 } }),
        api.get('/products', { params: { limit: 100 } }),
      ]);
      setCustomers(custRes.data.items);
      setProducts(prodRes.data.items);
    } catch (err) {
      console.error('Failed to load reference data', err);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadReferenceData();
    if (searchParams.get('new') === 'true') {
      const custIdParam = searchParams.get('customerId');
      if (custIdParam) setCustomerId(custIdParam);
      setIsCreateOpen(true);
    }
  }, []);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, notes: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!customerId) {
      setFormError('Please select a customer');
      return;
    }

    const invalidItems = items.some((i) => !i.productId || i.quantity <= 0);
    if (invalidItems) {
      setFormError('Please select a valid product and positive quantity for each line item');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: parseInt(customerId, 10),
        enquiryDate: enquiryDate ? new Date(enquiryDate).toISOString() : new Date().toISOString(),
        requiredDate: requiredDate ? new Date(requiredDate).toISOString() : null,
        items: items.map((i) => ({
          productId: parseInt(i.productId, 10),
          quantity: parseInt(i.quantity, 10),
          notes: i.notes || undefined,
        })),
      };

      await api.post('/enquiries', payload);
      setIsCreateOpen(false);
      // Reset form
      setCustomerId('');
      setItems([{ productId: '', quantity: 1, notes: '' }]);
      fetchEnquiries();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (enquiryId) => {
    try {
      const res = await api.get(`/enquiries/${enquiryId}`);
      setSelectedEnquiry(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (enquiryId, newStatus) => {
    try {
      await api.patch(`/enquiries/${enquiryId}/status`, { status: newStatus });
      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
      fetchEnquiries();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConvertToQuotation = (enquiry) => {
    setIsDetailOpen(false);
    navigate(`/quotations?createFromEnquiry=${enquiry.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Enquiries</h1>
          <p className="text-sm text-slate-500">
            Step 1 in ERP Workflow: Capture customer demand, requested delivery dates, and required product quantities.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Enquiry</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search enquiry # or customer name..."
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
            <option value="NEW">NEW</option>
            <option value="QUOTED">QUOTED</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>

          <button
            onClick={fetchEnquiries}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <span>Loading enquiries...</span>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-700">No enquiries found</p>
            <p className="text-xs text-slate-400 mt-1">Create an enquiry to start the sales workflow.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Enquiry #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Enquiry Date</th>
                  <th className="px-6 py-3.5">Required Date</th>
                  <th className="px-6 py-3.5 text-center">Items</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-700">
                      {enq.enquiryNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{enq.customer?.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {new Date(enq.enquiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {enq.requiredDate ? new Date(enq.requiredDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-xs">
                        {enq.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={enq.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(enq.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => handleConvertToQuotation(enq)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Create Quote</span>
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

      {/* Create Enquiry Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Customer Enquiry"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Customer *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.contactPerson})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Enquiry Date *
              </label>
              <input
                type="date"
                required
                value={enquiryDate}
                onChange={(e) => setEnquiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Required Delivery Date
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Requested Products & Quantities
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Product Line</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productCode} - {p.productName} (₹{p.basePrice} / {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex-1 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Specifications / Notes (optional)"
                      value={item.notes}
                      onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg self-end sm:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

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
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Save Customer Enquiry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Enquiry Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Enquiry Details: ${selectedEnquiry?.enquiryNumber || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedEnquiry && (
          <div className="space-y-6">
            {/* Stepper */}
            <WorkflowStepper currentStep="enquiry" status={selectedEnquiry.status} />

            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Enquiry Number</span>
                <span className="font-bold text-slate-800 text-sm font-mono">
                  {selectedEnquiry.enquiryNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Customer</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {selectedEnquiry.customer?.companyName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Enquiry Date</span>
                <span className="font-medium text-slate-700">
                  {new Date(selectedEnquiry.enquiryDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Status</span>
                <StatusBadge status={selectedEnquiry.status} />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Requested Item Details
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5 text-center">Quantity</th>
                      <th className="px-4 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedEnquiry.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          <div>{item.product?.productName}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {item.product?.productCode}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {item.quantity} {item.product?.unit}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {item.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Update Status:</span>
                {['NEW', 'QUOTED', 'WON', 'LOST'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedEnquiry.id, st)}
                    disabled={selectedEnquiry.status === st}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                      selectedEnquiry.status === st
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleConvertToQuotation(selectedEnquiry)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Generate Quotation</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
