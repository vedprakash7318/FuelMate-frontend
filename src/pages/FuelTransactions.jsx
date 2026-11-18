import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Fuel, 
  Droplets, 
  AlertTriangle, 
  Receipt,
  RotateCcw
} from 'lucide-react';
import api from '../utils/api';
import {
  formatCurrency, formatNumber, formatDateTime, formatLiters, getErrorMessage
} from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import ReceiptModal from '../components/common/ReceiptModal';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const FuelTransactions = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fuelType, setFuelType] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected for Receipt
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Cancel Transaction Modal
  const [cancelTxn, setCancelTxn] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchTransactions = async () => {
    try {
      let url = '/fuel?limit=100';
      if (fuelType !== 'all') url += `&fuelType=${fuelType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fuelType, startDate, endDate]);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Please enter reason for cancellation');
      return;
    }
    setCancelling(true);
    try {
      const res = await api.post(`/fuel/${cancelTxn._id}/cancel`, {
        reason: cancelReason.trim(),
      });
      if (res.data?.success) {
        toast.success('Transaction cancelled and khata reversed');
        setCancelTxn(null);
        setCancelReason('');
        fetchTransactions();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const filteredTxns = transactions.filter((t) => {
    const s = search.toLowerCase();
    return (
      t.transactionId?.toLowerCase().includes(s) ||
      t.ownerId?.name?.toLowerCase().includes(s) ||
      t.vehicleId?.vehicleNumber?.toLowerCase().includes(s)
    );
  });

  const totalAmount = filteredTxns
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const totalLiters = filteredTxns
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + (t.quantity || 0), 0);

  if (loading) return <LoadingSpinner text="Loading Fuel Transactions..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <span>Fuel Transactions</span>
          </h2>
          <p className="text-xs text-slate-500">
            {filteredTxns.length} entries • {formatLiters(totalLiters)} • {formatCurrency(totalAmount)}
          </p>
        </div>
        <button
          onClick={() => navigate('/fuel/new')}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-2.5">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Vehicle No, Slip No, Owner..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs">
          {[
            { id: 'all', label: 'All Fuel' },
            { id: 'Diesel', label: 'Diesel', icon: Droplets },
            { id: 'Petrol', label: 'Petrol', icon: Fuel },
          ].map((item) => {
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setFuelType(item.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  fuelType === item.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {IconComp && <IconComp className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions Feed */}
      <div className="space-y-2.5">
        {filteredTxns.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Fuel className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700 mt-2">No fuel entries found</p>
          </div>
        ) : (
          filteredTxns.map((txn) => (
            <div
              key={txn._id}
              onClick={() => setSelectedTxn(txn)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all tap-active"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      txn.fuelType === 'Petrol'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {txn.fuelType === 'Petrol' ? <Fuel className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="number-plate text-[10px]">{txn.vehicleId?.vehicleNumber || 'VEHICLE'}</span>
                      <StatusBadge status={txn.status} />
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {txn.ownerId?.name || 'Customer'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {txn.transactionId} • {formatDateTime(txn.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-extrabold text-slate-900 font-mono">
                    {formatCurrency(txn.totalAmount)}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {formatLiters(txn.quantity)} @ ₹{txn.pricePerLiter}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={txn.paymentType} type="payment" />
                  </div>
                </div>
              </div>

              {/* Bottom detail row */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Staff: {txn.createdBy?.name || 'Staff'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTxn(txn);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>Slip</span>
                  </button>

                  {isOwner && txn.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelTxn(txn);
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
      </div>

      {/* Slip Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedTxn)}
        onClose={() => setSelectedTxn(null)}
        txn={selectedTxn}
      />

      {/* Cancel Transaction Modal (Owner only) */}
      <Modal
        isOpen={Boolean(cancelTxn)}
        onClose={() => setCancelTxn(null)}
        title="Cancel Fuel Transaction"
        subtitle={`Transaction: ${cancelTxn?.transactionId}`}
      >
        <form onSubmit={handleCancel} className="space-y-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>Warning: Cancelling will reverse the fuel amount ({formatCurrency(cancelTxn?.totalAmount)}) from the owner's khata ledger and vehicle balance. This action cannot be undone.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cancellation Reason *
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Wrong quantity entered / Customer dispute"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cancelling}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md mt-2 disabled:opacity-50"
          >
            {cancelling ? 'Reversing Transaction...' : 'Confirm Reversal / Cancel Entry'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FuelTransactions;
