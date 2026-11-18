import React from 'react';
import { Check, Clock, AlertCircle, Fuel, Droplets, Zap, Ban } from 'lucide-react';

const StatusBadge = ({ status, type = 'status', size = 'normal' }) => {
  const isSm = size === 'sm';
  const pyClass = isSm ? 'py-0.5 px-2 text-[10px]' : 'py-0.5 px-2.5 text-xs';
  const iconSize = isSm ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (type === 'fuel') {
    let fuelList = [];
    if (Array.isArray(status)) {
      fuelList = status.filter(Boolean);
    } else if (typeof status === 'string' && status.trim()) {
      fuelList = status.split(',').map((s) => s.trim()).filter(Boolean);
    }

    if (fuelList.length === 0) {
      fuelList = ['Diesel'];
    }

    const renderSingleFuelBadge = (item, idx) => {
      const lower = item.toLowerCase();
      const isPetrol = lower.includes('petrol');
      const isDiesel = lower.includes('diesel');
      const isCng = lower.includes('cng');

      let colorClasses = 'bg-blue-100 text-blue-900 border border-blue-300';
      let IconComp = Zap;

      if (isPetrol) {
        colorClasses = 'bg-amber-100 text-amber-900 border border-amber-300';
        IconComp = Fuel;
      } else if (isDiesel) {
        colorClasses = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
        IconComp = Droplets;
      } else if (isCng) {
        colorClasses = 'bg-cyan-100 text-cyan-900 border border-cyan-300';
        IconComp = Zap;
      }

      return (
        <span
          key={idx !== undefined ? idx : item}
          className={`inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap ${pyClass} ${colorClasses}`}
        >
          <IconComp className={iconSize} />
          <span>{item}</span>
        </span>
      );
    };

    if (fuelList.length === 1) {
      return renderSingleFuelBadge(fuelList[0], 0);
    }

    return (
      <span className="inline-flex items-center gap-1 flex-wrap">
        {fuelList.map((item, idx) => renderSingleFuelBadge(item, idx))}
      </span>
    );
  }

  if (type === 'payment') {
    if (status === 'Full Payment') {
      return (
        <span className={`inline-flex items-center gap-1 rounded-md font-bold whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs ${pyClass}`}>
          <Check className={iconSize} />
          <span>Paid</span>
        </span>
      );
    }
    if (status === 'Partial Payment') {
      return (
        <span className={`inline-flex items-center gap-1 rounded-md font-bold whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs ${pyClass}`}>
          <Clock className={iconSize} />
          <span>Partial</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-md font-bold whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs ${pyClass}`}>
        <AlertCircle className={iconSize} />
        <span>Credit</span>
      </span>
    );
  }

  // Active / Inactive / Cancelled
  const isActive = status === 'active';
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-semibold bg-gray-100 text-gray-500 line-through whitespace-nowrap ${pyClass}`}>
        <Ban className={iconSize} />
        <span>Cancelled</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${pyClass} ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-slate-100 text-slate-600 border border-slate-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;
