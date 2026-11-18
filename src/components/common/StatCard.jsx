import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/helpers';

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  isCurrency = false,
  isLiters = false,
  onClick,
}) => {
  const colorSchemes = {
    blue: {
      bg: 'bg-blue-50/70',
      border: 'border-blue-100',
      text: 'text-blue-900',
      iconBg: 'bg-blue-600 text-white',
      accent: 'text-blue-600',
    },
    green: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-100',
      text: 'text-emerald-950',
      iconBg: 'bg-emerald-600 text-white',
      accent: 'text-emerald-600',
    },
    orange: {
      bg: 'bg-orange-50/70',
      border: 'border-orange-100',
      text: 'text-orange-950',
      iconBg: 'bg-orange-600 text-white',
      accent: 'text-orange-600',
    },
    rose: {
      bg: 'bg-rose-50/80',
      border: 'border-rose-200',
      text: 'text-rose-950',
      iconBg: 'bg-rose-600 text-white',
      accent: 'text-rose-600',
    },
    purple: {
      bg: 'bg-purple-50/70',
      border: 'border-purple-100',
      text: 'text-purple-950',
      iconBg: 'bg-purple-600 text-white',
      accent: 'text-purple-600',
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-900',
      iconBg: 'bg-slate-700 text-white',
      accent: 'text-slate-600',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  const displayValue = isCurrency
    ? formatCurrency(value)
    : isLiters
    ? `${formatNumber(value)} L`
    : value ?? 0;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 bg-white border ${scheme.border} shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md tap-active' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className={`mt-1.5 text-xl sm:text-2xl font-bold tracking-tight ${scheme.text}`}>
            {displayValue}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm ${scheme.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
