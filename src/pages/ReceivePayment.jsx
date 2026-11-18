import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Banknote, QrCode, User, Truck, Phone, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatNumber, getErrorMessage } from '../utils/helpers';
import ReceiptModal from '../components/common/ReceiptModal';
import SearchableSelect from '../components/common/SearchableSelect';
import toast from 'react-hot-toast';

const ReceivePayment = () => {
  const navigate = useNavigate();

  const [owners, setOwners] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);

  // Form State
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('owner'); // 'owner' | 'vehicle'
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash'); // Cash, UPI
  const [transactionRef, setTransactionRef] = useState('');
  const [remark, setRemark] = useState('');

  const [loading, setLoading] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ownersRes, vehiclesRes] = await Promise.all([
          api.get('/owners'),
          api.get('/vehicles'),
        ]);
        if (ownersRes.data?.success) setOwners(ownersRes.data.data);
        if (vehiclesRes.data?.success) setVehicles(vehiclesRes.data.data);
      } catch (err) {
        toast.error('Failed to load owners');
      }
    };
    fetchData();
  }, []);

  // Filter vehicles when owner changes
  useEffect(() => {
    if (selectedOwnerId) {
      const match = vehicles.filter(
        (v) => (v.ownerId?._id === selectedOwnerId || v.ownerId === selectedOwnerId) && v.status === 'active'
      );
      setFilteredVehicles(match);
      if (match.length > 0) {
        setSelectedVehicleId(match[0]._id);
      } else {
        setSelectedVehicleId('');
      }
    } else {
      setFilteredVehicles([]);
      setSelectedVehicleId('');
    }
  }, [selectedOwnerId, vehicles]);

  const selectedOwner = owners.find((o) => o._id === selectedOwnerId);
  const selectedVehicle = vehicles.find((v) => v._id === selectedVehicleId);

  // Calculations
  const currentOutstanding = adjustmentType === 'vehicle' && selectedVehicle
    ? selectedVehicle.pendingBalance
    : selectedOwner
    ? selectedOwner.totalOutstanding
    : 0;

  const numAmount = parseFloat(amount) || 0;
  const remainingAfterPayment = Math.max(0, Math.round((currentOutstanding - numAmount) * 100) / 100);

  // Quick Amount fill
  const handleFillFull = () => {
    if (currentOutstanding > 0) {
      setAmount(String(currentOutstanding));
    }
  };

  const ownerOptions = owners.map((o) => ({
    value: o._id,
    label: o.name,
    badge: o.ownerId,
    subtext: `${o.mobile} • Outstanding: ${formatCurrency(o.totalOutstanding)}`,
    searchText: `${o.name} ${o.mobile} ${o.ownerId} ${o.companyName || ''}`,
    icon: <User className="w-4 h-4 text-slate-400" />,
  }));

  const vehicleOptions = filteredVehicles.map((v) => ({
    value: v._id,
    label: v.vehicleNumber,
    badge: v.fuelType,
    subtext: `${v.vehicleName || v.vehicleType} • Pending: ${formatCurrency(v.pendingBalance)}`,
    searchText: `${v.vehicleNumber} ${v.vehicleName || ''} ${v.driverName} ${v.driverMobile}`,
    icon: <Truck className="w-4 h-4 text-slate-400" />,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOwnerId) {
      toast.error('Please select Customer Owner');
      return;
    }
    if (adjustmentType === 'vehicle' && !selectedVehicleId) {
      toast.error('Please select Vehicle');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ownerId: selectedOwnerId,
        adjustmentType,
        vehicleId: adjustmentType === 'vehicle' ? selectedVehicleId : undefined,
        amount: numAmount,
        paymentMode,
        transactionRef: transactionRef.trim() || undefined,
        remark: remark.trim() || undefined,
      };

      const res = await api.post('/payments', payload);
      if (res.data?.success) {
        toast.success('Payment recorded successfully');
        setReceiptPayment(res.data.data);
        // Reset form
        setAmount('');
        setTransactionRef('');
        setRemark('');
        // Refresh owners
        const ownersRes = await api.get('/owners');
        if (ownersRes.data?.success) setOwners(ownersRes.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </span>
            <span>Receive Payment</span>
          </h2>
          <p className="text-xs text-slate-500">Record customer deposit & settle khata</p>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <span>View Payments</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Step 1: Searchable Owner Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <SearchableSelect
            label="1. Select Customer"
            options={ownerOptions}
            value={selectedOwnerId}
            onChange={(val) => setSelectedOwnerId(val)}
            placeholder="Search Owner by Name, Mobile, ID..."
            searchPlaceholder="Type customer name, phone or ID..."
            required
            icon={<User className="w-4 h-4 text-slate-400" />}
          />

          {selectedOwner && (
            <div className="mt-3 p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-950">{selectedOwner.name}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{selectedOwner.mobile}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-rose-600">Total Outstanding</p>
                <p className="text-base font-extrabold text-rose-700 font-mono">
                  {formatCurrency(selectedOwner.totalOutstanding)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Adjustment Level (Owner vs Vehicle) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Payment Adjustment Level
          </label>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={() => setAdjustmentType('owner')}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                adjustmentType === 'owner'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-extrabold">Owner Level</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Adjust across all vehicles
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAdjustmentType('vehicle')}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                adjustmentType === 'vehicle'
                  ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-extrabold">Vehicle Level</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Adjust specific vehicle khata
              </p>
            </button>
          </div>

          {adjustmentType === 'vehicle' && (
            <div className="pt-2 border-t border-slate-100 animate-in fade-in">
              {!selectedOwnerId ? (
                <p className="text-xs text-slate-400">Please select an owner first</p>
              ) : filteredVehicles.length === 0 ? (
                <p className="text-xs text-amber-600">No vehicles under this owner</p>
              ) : (
                <SearchableSelect
                  label="Select Specific Vehicle *"
                  options={vehicleOptions}
                  value={selectedVehicleId}
                  onChange={(val) => setSelectedVehicleId(val)}
                  placeholder="Search vehicle by number plate or driver..."
                  searchPlaceholder="Type vehicle number..."
                  required
                  icon={<Truck className="w-4 h-4 text-slate-400" />}
                />
              )}
            </div>
          )}
        </div>

        {/* Step 3: Payment Amount & Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Payment Amount (₹) *
            </label>
            {currentOutstanding > 0 && (
              <button
                type="button"
                onClick={handleFillFull}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200"
              >
                Full Settle: ₹{formatNumber(currentOutstanding)}
              </button>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-extrabold text-slate-900 pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 focus:bg-white focus:outline-none transition-all font-mono"
              required
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[1000, 2000, 5000, 10000, 25000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
              >
                +₹{preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Payment Mode *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'Cash', label: 'Cash', icon: Banknote, sub: 'Cash at Counter' },
                { id: 'UPI', label: 'UPI / QR', icon: QrCode, sub: 'GPay, PhonePe, Paytm' },
              ].map((m) => {
                const IconComp = m.icon;
                const isSelected = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id)}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 transition-all tap-active ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <IconComp className={`w-5 h-5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="text-xs font-black">{m.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{m.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference UTR (Shown when UPI is selected) */}
          {paymentMode === 'UPI' && (
            <div className="pt-2 animate-in fade-in space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                UPI Reference ID / UTR Number (Optional)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 431092837241 or GPay ref"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Remark / Notes (Optional)
            </label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Settle last week diesel"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Live Balance Impact Preview */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Current Outstanding:</span>
              <span className="font-mono">{formatCurrency(currentOutstanding)}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>Payment To Settle:</span>
              <span className="font-mono">- {formatCurrency(numAmount)}</span>
            </div>
            <div className="flex justify-between text-amber-300 font-extrabold pt-1.5 border-t border-slate-800 text-sm">
              <span>Remaining Pending:</span>
              <span className="font-mono">{formatCurrency(remainingAfterPayment)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || numAmount <= 0}
          className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-emerald-600/30 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Wallet className="w-5 h-5" />
          )}
          <span>{loading ? 'Recording Payment...' : 'Receive Payment'}</span>
        </button>
      </form>

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />
    </div>
  );
};

export default ReceivePayment;
