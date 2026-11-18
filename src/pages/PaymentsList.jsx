import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Plus, 
  Search, 
  Receipt, 
  RotateCcw, 
  AlertTriangle 
} from 'lucide-react';
import api from '../utils/api';
import {
  formatCurrency, formatDateTime, getErrorMessage
} from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import ReceiptModal from '../components/common/ReceiptModal';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PaymentsList = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [modeFilter, setModeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Pagination & Summary
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ totalCollected: 0 });

  // Selected for Receipt
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Cancel Payment Modal
  const [cancelPaymentItem, setCancelPaymentItem] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchPayments = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = {
        page: targetPage,
        limit,
      };
      if (modeFilter !== 'all') params.paymentMode = modeFilter;
      if (search && search.trim()) params.search = search.trim();

      const res = await api.get('/payments', { params });
      if (res.data?.success) {
        setPayments(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchPayments(1);
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      fetchPayments(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [modeFilter, search]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchPayments(newPage);
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Please enter cancellation reason');
      return;
    }
    setCancelling(true);
    try {
      const res = await api.post(`/payments/${cancelPaymentItem._id}/cancel`, {
        reason: cancelReason.trim(),
      });
      if (res.data?.success) {
        toast.success('Payment cancelled and balance restored');
        setCancelPaymentItem(null);
        setCancelReason('');
        fetchPayments(page);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Payments..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </span>
            <span>Payment Records</span>
          </h2>
          <p className="text-xs text-slate-500">
            {total} records • Total: {formatCurrency(summary.totalCollected || 0)}
          </p>
        </div>
        <button
          onClick={() => navigate('/payments/new')}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Receive Payment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-2.5">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Receipt No, Owner, UTR Ref..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          {['all', 'Cash', 'UPI'].map((mode) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                modeFilter === mode
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode === 'all' ? 'All' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Cards */}
      <div className="space-y-2.5">
        {payments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700 mt-2">No payment records found</p>
          </div>
        ) : (
          payments.map((p) => (
            <div
              key={p._id}
              onClick={() => setSelectedPayment(p)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all tap-active"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {p.ownerId?.name || 'Customer'}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-emerald-700">{p.paymentMode}</span>
                      {p.transactionRef && ` (Ref: ${p.transactionRef})`}
                      {p.adjustmentType === 'vehicle' && p.vehicleId && (
                        <span> • Vehicle: <span className="font-mono">{p.vehicleId?.vehicleNumber || p.vehicleId}</span></span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {p.paymentId} • {formatDateTime(p.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-600 font-mono">
                    + {formatCurrency(p.amount)}
                  </p>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold capitalize">
                    {p.adjustmentType} level
                  </span>
                </div>
              </div>

              {/* Bottom detail row */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Received by: {p.receivedBy?.name || 'Staff'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPayment(p);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>Receipt</span>
                  </button>

                  {isOwner && p.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelPaymentItem(p);
                        setCancelReason('');
                      }}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] border border-rose-200 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Cancel / Reverse</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination Controls */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Slip Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />

      {/* Cancel Payment Modal (Owner Only) */}
      <Modal
        isOpen={Boolean(cancelPaymentItem)}
        onClose={() => setCancelPaymentItem(null)}
        title="Cancel Payment"
        subtitle={`Payment ID: ${cancelPaymentItem?.paymentId}`}
      >
        <form onSubmit={handleCancel} className="space-y-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>Warning: Cancelling will remove this payment of {formatCurrency(cancelPaymentItem?.amount)} from the owner's ledger and restore their pending balance.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cancellation Reason *
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Returned / Duplicate entry"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cancelling}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md mt-2 disabled:opacity-50"
          >
            {cancelling ? 'Reversing...' : 'Confirm Reversal / Cancel Payment'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentsList;
