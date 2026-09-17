import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import WorkflowStepper from '../../components/common/WorkflowStepper';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Eye,
  ShoppingCart,
  Printer,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function QuotationList() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Reference enquiries for creation
  const [enquiries, setEnquiries] = useState([]);

  // Create Quotation Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // View Quotation Detail Modal
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotations', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      setQuotations(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEnquiries = async () => {
    try {
      const res = await api.get('/enquiries', { params: { limit: 100 } });
      setEnquiries(res.data.items);
    } catch (err) {
      console.error('Failed to load enquiries', err);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadEnquiries();
    const createFromEnq = searchParams.get('createFromEnquiry');
    if (createFromEnq) {
      handleSelectEnquiry(createFromEnq);
      setIsCreateOpen(true);
    }
  }, []);

  const handleSelectEnquiry = async (enquiryId) => {
    setSelectedEnquiryId(enquiryId);
    if (!enquiryId) {
      setQuoteItems([]);
      return;
    }
    try {
      const res = await api.get(`/enquiries/${enquiryId}`);
      const enq = res.data;
      const mapped = enq.items.map((i) => ({
        productId: i.productId,
        productName: i.product?.productName,
        productCode: i.product?.productCode,
        unit: i.product?.unit,
        quantity: i.quantity,
        unitPrice: Number(i.product?.basePrice) || 0,
        discountPercent: 0,
        gstPercent: 18,
      }));
      setQuoteItems(mapped);

      // default valid for 15 days
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setValidUntil(d.toISOString().split('T')[0]);
    } catch (err) {
      setFormError('Failed to fetch enquiry items: ' + err.message);
    }
  };

  const handleItemPriceChange = (index, field, value) => {
    const updated = [...quoteItems];
    updated[index][field] = parseFloat(value) || 0;
    setQuoteItems(updated);
  };

  // Calculate totals for create modal
  const calculateTotals = () => {
    let subtotal = 0;
    let gstTotal = 0;
    quoteItems.forEach((item) => {
      const net = (item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discountPercent || 0) / 100);
      const gst = net * ((item.gstPercent || 18) / 100);
      subtotal += net;
      gstTotal += gst;
    });
    return { subtotal, gstTotal, grandTotal: subtotal + gstTotal };
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedEnquiryId) {
      setFormError('Please select a customer enquiry');
      return;
    }

    setSubmitting(true);
    try {
      const enq = enquiries.find((e) => e.id === parseInt(selectedEnquiryId, 10));
      const payload = {
        enquiryId: parseInt(selectedEnquiryId, 10),
        customerId: enq?.customerId,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        items: quoteItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          gstPercent: i.gstPercent,
        })),
      };

      await api.post('/quotations', payload);
      setIsCreateOpen(false);
      setSelectedEnquiryId('');
      setQuoteItems([]);
      fetchQuotations();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (quoteId) => {
    try {
      const res = await api.get(`/quotations/${quoteId}`);
      setSelectedQuotation(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      await api.patch(`/quotations/${quoteId}/status`, { status: newStatus });
      if (selectedQuotation && selectedQuotation.id === quoteId) {
        setSelectedQuotation({ ...selectedQuotation, status: newStatus });
      }
      fetchQuotations();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConvertToOrder = async (quoteId) => {
    try {
      const res = await api.post('/orders', { quotationId: quoteId });
      setIsDetailOpen(false);
      navigate('/orders');
    } catch (err) {
      alert('Order creation failed: ' + err.message);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Quotations</h1>
          <p className="text-sm text-slate-500">
            Step 2 in ERP Workflow: Generate formal price quotes with tax calculation (GST 18%) and client acceptance status.
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
          <span>New Quotation</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search quotation # or customer..."
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
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button
            onClick={fetchQuotations}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <span>Loading quotations...</span>
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-700">No quotations found</p>
            <p className="text-xs text-slate-400 mt-1">Generate a quotation from customer enquiries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Quotation #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Enquiry Ref</th>
                  <th className="px-6 py-3.5">Valid Until</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-700">
                      {q.quotationNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{q.customer?.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-mono">
                      {q.enquiry?.enquiryNumber || `ENQ-${q.enquiryId}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ₹{Number(q.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(q.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>

                      {q.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleConvertToOrder(q.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Create Order</span>
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

      {/* Create Quotation Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Formal Quotation"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Source Customer Enquiry *
              </label>
              <select
                required
                value={selectedEnquiryId}
                onChange={(e) => handleSelectEnquiry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Customer Enquiry...</option>
                {enquiries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.enquiryNumber} — {e.customer?.companyName} ({e.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Quotation Validity Date
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pricing Calculation Table */}
          {quoteItems.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
                Itemized Pricing & GST Breakdown
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price (₹)</th>
                      <th className="px-4 py-2.5 text-right">Discount %</th>
                      <th className="px-4 py-2.5 text-right">GST %</th>
                      <th className="px-4 py-2.5 text-right">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quoteItems.map((item, idx) => {
                      const net = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
                      const gst = net * (item.gstPercent / 100);
                      const lineTotal = net + gst;

                      return (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            <div>{item.productName}</div>
                            <div className="text-xs text-slate-400 font-mono">
                              {item.productCode}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemPriceChange(idx, 'unitPrice', e.target.value)}
                              className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.discountPercent}
                              onChange={(e) => handleItemPriceChange(idx, 'discountPercent', e.target.value)}
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-600 font-mono">
                            {item.gstPercent}%
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            ₹{lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col items-end gap-1.5 text-sm">
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-600">
                  <span>GST Amount (18%):</span>
                  <span className="font-semibold">₹{totals.gstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 font-bold text-base text-slate-900 border-t border-slate-300 pt-1 mt-1">
                  <span>Grand Total:</span>
                  <span className="text-indigo-700">₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
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
              disabled={submitting || quoteItems.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Create Quotation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Quotation Detail / Printable Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Quotation: ${selectedQuotation?.quotationNumber || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedQuotation && (
          <div className="space-y-6">
            {/* Stepper */}
            <div className="no-print">
              <WorkflowStepper currentStep="quotation" status={selectedQuotation.status} />
            </div>

            {/* Printable Document Header */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-black text-xl text-slate-900">Apex Manufacturing & Supply</h3>
                  <p className="text-slate-500">100 Industrial Estate, Manufacturing Hub</p>
                  <p className="text-slate-500">GSTIN: 27AAAAA0000A1Z5 • Email: billing@erp.com</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 font-bold rounded-lg text-sm bg-indigo-100 text-indigo-800 font-mono">
                    {selectedQuotation.quotationNumber}
                  </span>
                  <div className="mt-2 text-slate-500">
                    Date: {new Date(selectedQuotation.quotationDate).toLocaleDateString()}
                  </div>
                  {selectedQuotation.validUntil && (
                    <div className="text-slate-500">
                      Valid Until: {new Date(selectedQuotation.validUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Bill To */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold uppercase text-slate-400 block mb-1">Customer / Bill To</span>
                  <div className="font-bold text-sm text-slate-800">
                    {selectedQuotation.customer?.companyName}
                  </div>
                  <div className="text-slate-600">Attn: {selectedQuotation.customer?.contactPerson}</div>
                  <div className="text-slate-500">Phone: {selectedQuotation.customer?.mobile}</div>
                  <div className="text-slate-500">City: {selectedQuotation.customer?.city || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold uppercase text-slate-400 block mb-1">Current Status</span>
                  <StatusBadge status={selectedQuotation.status} />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Item & Description</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Disc %</th>
                    <th className="px-4 py-2.5 text-right">GST %</th>
                    <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedQuotation.itemsList?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <div>{item.product?.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.product?.productCode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                        {item.quantity} {item.product?.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        ₹{Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(item.discountPercent)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(item.gstPercent)}%
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        ₹{Number(item.lineAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col items-end gap-1 text-xs">
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Net Total Amount:</span>
                  <span className="font-semibold">
                    ₹{Number(selectedQuotation.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-64 text-slate-600">
                  <span>GST (Tax):</span>
                  <span className="font-semibold">
                    ₹{Number(selectedQuotation.gstAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-64 font-bold text-sm text-slate-900 border-t border-slate-300 pt-1 mt-1">
                  <span>Grand Total:</span>
                  <span className="text-indigo-700">
                    ₹{(Number(selectedQuotation.totalAmount) + Number(selectedQuotation.gstAmount)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Quotation</span>
                </button>

                <span className="text-slate-300">|</span>

                <button
                  onClick={() => handleStatusChange(selectedQuotation.id, 'SENT')}
                  disabled={selectedQuotation.status !== 'DRAFT'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>Mark Sent</span>
                </button>

                <button
                  onClick={() => handleStatusChange(selectedQuotation.id, 'ACCEPTED')}
                  disabled={selectedQuotation.status === 'ACCEPTED'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Mark Accepted (Won)</span>
                </button>

                <button
                  onClick={() => handleStatusChange(selectedQuotation.id, 'REJECTED')}
                  disabled={selectedQuotation.status === 'REJECTED'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 disabled:opacity-40"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Reject (Lost)</span>
                </button>
              </div>

              {selectedQuotation.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleConvertToOrder(selectedQuotation.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/25 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Convert to Sales Order</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
