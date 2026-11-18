import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, Wallet, UserPlus, Car, X } from 'lucide-react';

const QuickActionSheet = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'New Fuel Filling',
      desc: 'Petrol & Diesel dispensing',
      icon: <Fuel className="w-6 h-6 text-white" />,
      to: '/fuel/new',
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-200',
    },
    {
      title: 'Receive Payment',
      desc: 'Cash & UPI collection',
      icon: <Wallet className="w-6 h-6 text-white" />,
      to: '/payments/new',
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200',
    },
    {
      title: 'New Customer',
      desc: 'Open customer khata account',
      icon: <UserPlus className="w-6 h-6 text-white" />,
      to: '/owners/add',
      bg: 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200',
    },
    {
      title: 'Register Vehicle',
      desc: 'Add car, truck, dumper etc.',
      icon: <Car className="w-6 h-6 text-white" />,
      to: '/vehicles/add',
      bg: 'bg-gradient-to-br from-purple-600 to-violet-800 shadow-purple-200',
    },
  ];

  const handleSelect = (to) => {
    onClose();
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
            <p className="text-xs text-slate-500">Select an action to proceed</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {actions.map((act) => (
            <button
              key={act.to}
              onClick={() => handleSelect(act.to)}
              className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 shadow-sm hover:shadow flex flex-col items-start text-left transition-all active:scale-95 group"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md mb-3 ${act.bg}`}
              >
                {act.icon}
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                {act.title}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{act.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionSheet;
