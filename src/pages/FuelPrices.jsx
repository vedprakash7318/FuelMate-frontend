import React, { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, History, Fuel, Droplets, Zap } from 'lucide-react';
import api from '../utils/api';
import { formatDateTime, formatRelativeTime, getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const FuelPrices = () => {
  const [fuelList, setFuelList] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update Rate Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [targetFuel, setTargetFuel] = useState('Diesel');
  const [newPrice, setNewPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create New Fuel Type Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFuelName, setCreateFuelName] = useState('');
  const [createFuelPrice, setCreateFuelPrice] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [curRes, histRes] = await Promise.all([
        api.get('/fuel-prices/current'),
        api.get('/fuel-prices/history'),
      ]);
      if (curRes.data?.success && curRes.data.data) {
        const d = curRes.data.data;
        const list = d.fuelList || [];
        setFuelList(list);
      }
      if (histRes.data?.success) {
        setHistory(histRes.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenUpdate = (item) => {
    setTargetFuel(item.fuelType);
    setNewPrice(String(item.price || ''));
    setIsUpdateModalOpen(true);
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    const val = parseFloat(newPrice);
    if (!val || val <= 0) {
      toast.error('Please enter a valid price per liter');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/fuel-prices', {
        fuelType: targetFuel,
        price: val,
      });
      if (res.data?.success) {
        toast.success(`${targetFuel} rate updated to ₹${val.toFixed(2)}/L`);
        setIsUpdateModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFuelType = async (e) => {
    e.preventDefault();
    if (!createFuelName.trim() || !createFuelPrice) {
      toast.error('Fuel name and rate are required');
      return;
    }
    const val = parseFloat(createFuelPrice);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid positive price');
      return;
    }

    setCreating(true);
    try {
      const trimmed = createFuelName.trim();
      const res = await api.post('/fuel-prices', {
        fuelType: trimmed,
        price: val,
      });
      if (res.data?.success) {
        toast.success(`New fuel type "${trimmed}" registered at ₹${val.toFixed(2)}/L`);
        setIsCreateModalOpen(false);
        setCreateFuelName('');
        setCreateFuelPrice('');
        fetchData();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Fuel Prices..." />;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5 truncate">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </span>
            <span>Fuel Prices</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            Manage live rates and add fuel products
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Fuel</span>
        </button>
      </div>

      {/* Fuel Product Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {fuelList.map((item) => {
          const isPetrol = item.fuelType.toLowerCase().includes('petrol');
          const isDiesel = item.fuelType.toLowerCase().includes('diesel');
          const isCNG = item.fuelType.toLowerCase().includes('cng');

          const bgClass = isPetrol
            ? 'from-amber-500 to-orange-600 shadow-orange-600/20'
            : isDiesel
            ? 'from-emerald-600 to-teal-700 shadow-emerald-600/20'
            : isCNG
            ? 'from-cyan-600 to-blue-700 shadow-cyan-600/20'
            : 'from-indigo-600 to-purple-800 shadow-indigo-600/20';

          return (
            <div
              key={item.fuelType}
              className={`bg-gradient-to-br ${bgClass} text-white rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between`}
            >
              {/* Card Header: Product Icon & Live Status */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/15 truncate">
                  {isPetrol ? (
                    <Fuel className="w-3.5 h-3.5" />
                  ) : isDiesel ? (
                    <Droplets className="w-3.5 h-3.5" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate">{item.fuelType}</span>
                </span>
                <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full border border-white/20 shrink-0">
                  Live
                </span>
              </div>

              {/* Price Display */}
              <div className="my-2.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white whitespace-nowrap">
                    ₹{Number(item.price).toFixed(2)}
                  </span>
                  <span className="text-[11px] font-bold text-white/80">/L</span>
                </div>
                {item.effectiveFrom && (
                  <p className="text-[10px] text-white/70 mt-0.5 font-medium truncate">
                    {formatRelativeTime(item.effectiveFrom)}
                  </p>
                )}
              </div>

              {/* Action Button: Full width at bottom */}
              <button
                type="button"
                onClick={() => handleOpenUpdate(item)}
                className="w-full py-2 px-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-xs hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-700" />
                <span>Update Rate</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Price Change History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-600" />
          <span>Price Change History</span>
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No historical price changes recorded</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div key={item._id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0">
                    <Tag className="w-4 h-4 text-slate-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.fuelType}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {formatRelativeTime(item.effectiveFrom)} • By: {item.setBy?.name || 'Owner'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold font-mono text-slate-900">
                    ₹{Number(item.price).toFixed(2)}/L
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Rate Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Set New Rate for ${targetFuel}`}
        subtitle="New rate will apply to all subsequent fillings"
      >
        <form onSubmit={handleUpdatePrice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              New Price Per Liter (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                required
              />
            </div>

            {/* Quick Adjustment Pills */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quick:</span>
              {[-1.0, -0.5, +0.5, +1.0].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => {
                    const current = parseFloat(newPrice) || 0;
                    const updated = Math.max(0, current + delta);
                    setNewPrice(updated.toFixed(2));
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg text-[11px] font-bold text-slate-700 font-mono transition-all"
                >
                  {delta > 0 ? `+₹${delta.toFixed(2)}` : `-₹${Math.abs(delta).toFixed(2)}`}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md active:scale-98 transition-all disabled:opacity-50"
          >
            {submitting ? 'Updating...' : `Save & Apply New ${targetFuel} Rate`}
          </button>
        </form>
      </Modal>

      {/* Create New Fuel Type Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Fuel Product"
        subtitle="Add custom product (e.g. CNG, Speed, Power, XP95, Premium Diesel, DEF/AdBlue)"
      >
        <form onSubmit={handleCreateFuelType} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Fuel Product Name *
            </label>
            <input
              type="text"
              value={createFuelName}
              onChange={(e) => setCreateFuelName(e.target.value)}
              placeholder="e.g. CNG, Speed, Power, XP95, DEF / AdBlue"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Rate Per Liter / Unit (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={createFuelPrice}
                onChange={(e) => setCreateFuelPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md mt-2 disabled:opacity-50"
          >
            {creating ? 'Creating Product...' : 'Create Fuel Product & Set Rate'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FuelPrices;
