import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Fuel, Droplets, Wallet, Users, Truck, ArrowRight, RefreshCw,
  AlertTriangle, AlertCircle, Phone, MessageSquare, ShieldCheck,
  UserCheck, BarChart3, Clock, Plus, UserPlus
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  formatCurrency, formatNumber, formatDate, formatDateTime, formatRelativeTime,
  formatLiters, generateWhatsAppLink, getErrorMessage
} from '../utils/helpers';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import toast from 'react-hot-toast';

const FUEL_COLORS = ['#ea580c', '#059669']; // Petrol Orange, Diesel Emerald

const Dashboard = () => {
  const { user, isOwner, pumpSettings } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const endpoint = isOwner ? '/dashboard/owner' : '/dashboard/employee';
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [isOwner]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) return <LoadingSpinner text="Loading Dashboard..." />;

  // OWNER DASHBOARD
  if (isOwner) {
    const pieData = [
      { name: 'Petrol', value: data?.petrolSales?.amount || 0 },
      { name: 'Diesel', value: data?.dieselSales?.amount || 0 },
    ];

    const chartData = (data?.dailySalesChart || []).map((item) => ({
      date: item._id?.slice(5) || '',
      amount: item.totalAmount || 0,
      quantity: item.totalQuantity || 0,
    }));

    return (
      <div className="space-y-4">
        {/* Top Greeting & Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              <span>Welcome, {user?.name}</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className={`px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all ${
              refreshing ? 'opacity-50' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Hero Card: Total Outstanding Pending Balance */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-red-900 text-white p-5 shadow-xl shadow-rose-900/20">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Total Outstanding Balance</span>
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white tracking-tight">
                {formatCurrency(data?.totalOutstanding || 0)}
              </h3>
              <p className="text-xs text-rose-100 mt-1">
                From registered customer owners across all vehicles
              </p>
            </div>
            <button
              onClick={() => navigate('/owners')}
              className="px-3.5 py-2 rounded-xl bg-white text-rose-700 font-bold text-xs shadow-md hover:bg-rose-50 active:scale-95 transition-all flex-shrink-0"
            >
              View Customers →
            </button>
          </div>
        </div>

        {/* Quick Operational Counters */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            title="Today's Fuel Sales"
            value={data?.todayFuelSales || 0}
            subtitle="Total sales today"
            icon={<Fuel className="w-5 h-5 text-white" />}
            color="orange"
            isCurrency
            onClick={() => navigate('/fuel')}
          />
          <StatCard
            title="Today's Collection"
            value={data?.todayPaymentCollection || 0}
            subtitle="Collected today"
            icon={<Wallet className="w-5 h-5 text-white" />}
            color="green"
            isCurrency
            onClick={() => navigate('/payments')}
          />
          <StatCard
            title="Customers"
            value={data?.totalOwners || 0}
            subtitle="Active accounts"
            icon={<Users className="w-5 h-5 text-white" />}
            color="blue"
            onClick={() => navigate('/owners')}
          />
          <StatCard
            title="Vehicles"
            value={data?.totalVehicles || 0}
            subtitle="Fleet vehicles"
            icon={<Truck className="w-5 h-5 text-white" />}
            color="purple"
            onClick={() => navigate('/vehicles')}
          />
        </div>

        {/* Fuel Split Cards (Petrol & Diesel) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-600" />
                <span>Petrol Sales</span>
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                {formatLiters(data?.petrolSales?.quantity || 0)}
              </span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-amber-950">
              {formatCurrency(data?.petrolSales?.amount || 0)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                <span>Diesel Sales</span>
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                {formatLiters(data?.dieselSales?.quantity || 0)}
              </span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-950">
              {formatCurrency(data?.dieselSales?.amount || 0)}
            </p>
          </div>
        </div>

        {/* 14-Day Sales Trend Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Daily Fuel Sales Trend
                </h4>
                <p className="text-xs font-medium text-slate-700">14-Day Sales History (₹)</p>
              </div>
              <span className="text-xs font-bold text-blue-600">Total Litres & Rupee Trend</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Sales Amount']}
                    labelFormatter={(lbl) => `Date: ${lbl}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Pending Customers with 1-Click WhatsApp & Call */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Top Outstanding Customers</span>
              </h4>
              <p className="text-xs text-slate-500">Tap to call or send WhatsApp payment reminder</p>
            </div>
            <button
              onClick={() => navigate('/owners')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              All →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(data?.topPendingOwners || []).map((owner) => {
              const waLink = generateWhatsAppLink(
                owner.mobile,
                owner.name,
                owner.totalOutstanding,
                pumpSettings?.pumpName || 'Petrol Pump'
              );

              return (
                <div key={owner._id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{owner.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{owner.mobile}</span>
                      <span>• {owner.totalVehicles || 1} Vehicle(s)</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-extrabold text-rose-600 font-mono">
                      {formatCurrency(owner.totalOutstanding)}
                    </span>
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center transition-colors"
                        title="WhatsApp Reminder"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                    {owner.mobile && (
                      <a
                        href={`tel:${owner.mobile}`}
                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center justify-center transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Fuel Transactions Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-blue-600" />
              <span>Recent Fuel Fillings</span>
            </h4>
            <button
              onClick={() => navigate('/fuel')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(data?.recentFuelTransactions || []).slice(0, 5).map((txn) => (
              <div key={txn._id} className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 -mx-1 px-1 rounded-xl transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    txn.fuelType === 'Petrol' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {txn.fuelType === 'Petrol' ? <Fuel className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="number-plate text-[10px] shrink-0">{txn.vehicleId?.vehicleNumber || 'VEHICLE'}</span>
                      <span className="text-xs font-bold text-slate-800 truncate" title={txn.ownerId?.name}>{txn.ownerId?.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      <span className="font-semibold text-slate-700">{formatLiters(txn.quantity)}</span>
                      <span> @ ₹{txn.pricePerLiter}/L</span>
                      <span> • </span>
                      <span className="text-slate-400">{formatRelativeTime(txn.createdAt)}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono">{formatCurrency(txn.totalAmount)}</p>
                  <div className="mt-0.5">
                    <StatusBadge status={txn.paymentType} type="payment" size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // EMPLOYEE DASHBOARD (Operational Focused)
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-1.5">
            <span>Welcome, {user?.name}</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </h2>
          <p className="text-xs text-slate-500 font-medium">Daily Counter Operations</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/fuel/new')}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 text-left flex flex-col justify-between h-28 active:scale-98 transition-all"
        >
          <div className="flex items-center justify-between">
            <Fuel className="w-8 h-8 text-white" />
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">New</span>
          </div>
          <div>
            <h4 className="font-extrabold text-base leading-tight">Fuel Filling</h4>
            <p className="text-xs text-orange-100 font-medium">Record fuel entry</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/payments/new')}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 text-left flex flex-col justify-between h-28 active:scale-98 transition-all"
        >
          <div className="flex items-center justify-between">
            <Wallet className="w-8 h-8 text-white" />
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Collect</span>
          </div>
          <div>
            <h4 className="font-extrabold text-base leading-tight">Receive Payment</h4>
            <p className="text-xs text-emerald-100 font-medium">Collect Cash or UPI</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/owners/add')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs text-left flex items-center gap-3 active:scale-98 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">New Customer</p>
            <p className="text-[11px] text-slate-400">Open khata account</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/vehicles/add')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-purple-400 shadow-xs text-left flex items-center gap-3 active:scale-98 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">New Vehicle</p>
            <p className="text-[11px] text-slate-400">Add to fleet</p>
          </div>
        </button>
      </div>

      {/* Today's Counters for Employee */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Today's Counter Summary</span>
          </h4>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
            {data?.todayFuelEntries || 0} Entries
          </span>
        </div>

        {/* 2x2 Balanced Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Fuel Sales Amount */}
          <div className="p-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/70 rounded-xl border border-blue-100 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-blue-800">Fuel Sales</span>
              <Fuel className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-base sm:text-lg font-black text-blue-950 font-mono tracking-tight whitespace-nowrap">
              {formatCurrency(data?.todayFuelAmount || 0)}
            </p>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">
              {data?.todayFuelEntries || 0} total fillings
            </p>
          </div>

          {/* Card 2: Cash/UPI Payments Collected */}
          <div className="p-3 bg-gradient-to-br from-emerald-50/80 to-teal-50/70 rounded-xl border border-emerald-100 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-800">Collected</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-base sm:text-lg font-black text-emerald-950 font-mono tracking-tight whitespace-nowrap">
              {formatCurrency(data?.todayPaymentCollection || 0)}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
              Cash & UPI counter
            </p>
          </div>

          {/* Card 3: Petrol Dispensed Quantity */}
          <div className="p-3 bg-gradient-to-br from-amber-50/80 to-orange-50/70 rounded-xl border border-amber-100 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-900">Petrol Dispensed</span>
              <Fuel className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-base sm:text-lg font-black text-amber-950 font-mono tracking-tight whitespace-nowrap">
              {formatLiters(data?.todayPetrolQuantity || 0)}
            </p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">
              @ ₹{pumpSettings?.petrolPrice || 96.72}/L
            </p>
          </div>

          {/* Card 4: Diesel Dispensed Quantity */}
          <div className="p-3 bg-gradient-to-br from-teal-50/80 to-emerald-50/70 rounded-xl border border-teal-100 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-teal-900">Diesel Dispensed</span>
              <Droplets className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-base sm:text-lg font-black text-teal-950 font-mono tracking-tight whitespace-nowrap">
              {formatLiters(data?.todayDieselQuantity || 0)}
            </p>
            <p className="text-[10px] text-teal-700 font-medium mt-0.5">
              @ ₹{pumpSettings?.dieselPrice || 89.62}/L
            </p>
          </div>
        </div>
      </div>

      {/* Recent Entries by Employee */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Recent Activity</span>
          </h4>
          <button
            onClick={() => navigate('/fuel')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            <span>All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {(data?.recentEntries || []).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No transactions recorded today</p>
          ) : (
            (data?.recentEntries || []).map((txn) => (
              <div
                key={txn._id}
                className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 -mx-1 px-1 rounded-xl transition-colors"
              >
                {/* Left: Vehicle Plate + Owner Name + Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="number-plate text-[10px] font-bold shrink-0">
                      {txn.vehicleId?.vehicleNumber || 'VEHICLE'}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate" title={txn.ownerId?.name}>
                      {txn.ownerId?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                    <span className={`font-semibold shrink-0 ${txn.fuelType === 'Petrol' ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {txn.fuelType}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono font-medium text-slate-700 shrink-0">{formatLiters(txn.quantity)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 shrink-0">{formatRelativeTime(txn.createdAt)}</span>
                  </div>
                </div>

                {/* Right: Amount & Compact Badge */}
                <div className="text-right shrink-0 flex flex-col items-end justify-center">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono tracking-tight">
                    {formatCurrency(txn.totalAmount)}
                  </p>
                  <div className="mt-0.5">
                    <StatusBadge status={txn.paymentType} type="payment" size="sm" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
