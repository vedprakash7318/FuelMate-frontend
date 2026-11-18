import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Users, Fuel, Wallet, Plus, Menu, X, Zap, Droplets,
  BarChart3, Truck, BookOpen, Tag, Settings, UserCog, LogOut,
  Monitor, Smartphone, ShieldCheck, UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import QuickActionSheet from '../common/QuickActionSheet';
import api from '../../utils/api';

const MobileLayout = ({ children }) => {
  const { user, logout, isOwner, pumpSettings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [currentPrices, setCurrentPrices] = useState({ petrol: null, diesel: null });
  // View mode: 'mobile-app' (centered phone container on desktop) vs 'fluid' (full width)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('petrol_view_mode') || 'fluid';
  });

  useEffect(() => {
    // Fetch fuel prices for ticker
    api.get('/fuel-prices/current')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setCurrentPrices({
            petrol: d.Petrol || d.petrol?.price || 96.72,
            diesel: d.Diesel || d.diesel?.price || 89.62,
          });
        }
      })
      .catch(() => {});
  }, []);

  const toggleViewMode = () => {
    const next = viewMode === 'fluid' ? 'mobile-app' : 'fluid';
    setViewMode(next);
    localStorage.setItem('petrol_view_mode', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Bottom Navigation Items (English only, SVG icons)
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/owners', label: 'Customers', icon: Users },
    { isFab: true }, // Center action button
    { to: '/fuel', label: 'Fuel', icon: Fuel },
    { to: '/payments', label: 'Payments', icon: Wallet },
  ];

  // Drawer links (English only, SVG icons)
  const drawerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3, desc: 'Overall Business Summary' },
    { to: '/owners', label: 'Customers', icon: Users, desc: 'Khata & Balances' },
    { to: '/vehicles', label: 'Vehicles', icon: Truck, desc: 'Manage Fleet & Drivers' },
    { to: '/fuel/new', label: 'New Fuel Filling', icon: Fuel, desc: 'Record filling entry' },
    { to: '/payments/new', label: 'Receive Payment', icon: Wallet, desc: 'Accept cash / UPI' },
    { to: '/fuel', label: 'Fuel Transactions', icon: Fuel, desc: 'History of fillings' },
    { to: '/payments', label: 'Payment Records', icon: Wallet, desc: 'All collections' },
    { to: '/ledger', label: 'Passbook Ledger', icon: BookOpen, desc: 'Debit / Credit passbook' },
    ...(isOwner
      ? [
          { to: '/fuel-prices', label: 'Fuel Prices', icon: Tag, desc: 'Set Petrol/Diesel Rates' },
          { to: '/reports', label: 'Reports & Analytics', icon: BarChart3, desc: 'PDF & Excel Exports' },
          { to: '/employees', label: 'Staff Management', icon: UserCog, desc: 'Employees & Access' },
          { to: '/settings', label: 'Pump Settings', icon: Settings, desc: 'Pump profile & Details' },
        ]
      : []),
  ];

  return (
    <div className={`min-h-screen bg-slate-200 flex flex-col items-center justify-start ${viewMode === 'mobile-app' ? 'p-0 sm:py-6' : ''}`}>
      
      {/* Top Desktop Controls Bar */}
      <div className="hidden sm:flex w-full max-w-6xl items-center justify-between px-4 py-2 text-xs text-slate-600 mb-1">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-800">Petrol Pump Khata Manager</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium text-[10px]">v1.0</span>
          {pumpSettings?.pumpName && (
            <span className="text-slate-500">• {pumpSettings.pumpName}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium shadow-xs transition-all"
            title="Toggle between Mobile App Frame and Fluid Desktop Layout"
          >
            {viewMode === 'mobile-app' ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Full Width View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile App View</span>
              </>
            )}
          </button>
          <span className="text-slate-300">|</span>
          <span className="font-medium text-slate-700">{user?.name} ({user?.role})</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main App Container */}
      <div
        className={`w-full bg-slate-50 flex flex-col min-h-screen relative shadow-2xl transition-all duration-300 ${
          viewMode === 'mobile-app'
            ? 'sm:max-w-[430px] sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[42px] sm:border-[8px] sm:border-slate-800 sm:overflow-hidden'
            : 'max-w-7xl sm:min-h-screen sm:rounded-none'
        }`}
      >
        {/* Mobile Status Bar Simulation */}
        {viewMode === 'mobile-app' && (
          <div className="hidden sm:flex items-center justify-between px-7 pt-3 pb-1 text-xs font-semibold select-none bg-blue-900 text-white">
            <span>9:41</span>
            <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Top App Header */}
        <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-md">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Hamburger & Pump Name / User Avatar */}
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <button
                onClick={() => setIsMoreDrawerOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all shrink-0 border border-white/10"
                aria-label="Open Menu"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              <div className="truncate">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{pumpSettings?.pumpName || 'Petrol Pump Khata'}</span>
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-blue-200 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider shrink-0 ${
                    isOwner ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
                  }`}>
                    {isOwner ? <ShieldCheck className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                    <span>{isOwner ? 'Owner' : 'Staff'}</span>
                  </span>
                  <span className="truncate font-medium">{user?.name}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsQuickOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1 font-bold text-xs shadow-xs active:scale-95 transition-all"
                title="Quick Action"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px]">Quick</span>
              </button>
            </div>
          </div>

          {/* Fuel Rates Ticker Bar */}
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 px-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold tracking-tight whitespace-nowrap shrink-0">
              <Fuel className="w-3.5 h-3.5 text-amber-300" />
              <span>Petrol:</span>
              <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white border border-amber-400/20">
                ₹{currentPrices.petrol || '96.72'}/L
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold tracking-tight whitespace-nowrap shrink-0">
              <Droplets className="w-3.5 h-3.5 text-emerald-300" />
              <span>Diesel:</span>
              <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white border border-emerald-400/20">
                ₹{currentPrices.diesel || '89.62'}/L
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-32 sm:pb-36 px-3 sm:px-5 py-3.5">
          {children}
          {/* Scroll clearance spacer */}
          <div className="h-10 w-full shrink-0" />
        </main>

        {/* Bottom App Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-mobile safe-bottom sm:absolute">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {navItems.map((item) => {
              if (item.isFab) {
                return (
                  <div key="fab" className="relative -top-5">
                    <button
                      onClick={() => setIsQuickOpen(true)}
                      className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-90 transition-all border-4 border-slate-100 hover:from-blue-600 hover:to-indigo-500"
                      aria-label="Add Transaction"
                    >
                      <Plus className="w-7 h-7 stroke-[2.5]" />
                    </button>
                  </div>
                );
              }

              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                      isActive
                        ? 'text-blue-600 font-bold scale-105'
                        : 'text-slate-400 hover:text-slate-600 font-medium'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[11px] tracking-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Quick Actions Bottom Sheet */}
        <QuickActionSheet isOpen={isQuickOpen} onClose={() => setIsQuickOpen(false)} />

        {/* Side Drawer */}
        {isMoreDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMoreDrawerOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              {/* Drawer Header */}
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                    <Fuel className="w-6 h-6 text-amber-400" />
                  </div>
                  <button
                    onClick={() => setIsMoreDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-base leading-tight text-white">
                  {pumpSettings?.pumpName || 'Petrol Pump Khata'}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">{pumpSettings?.tagline || 'Khata Management Software'}</p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-blue-300 text-[11px] capitalize">Role: {user?.role}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    isOwner ? 'bg-amber-400 text-slate-900' : 'bg-emerald-400 text-slate-900'
                  }`}>
                    {isOwner ? <ShieldCheck className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                    <span>{user?.role?.toUpperCase()}</span>
                  </span>
                </div>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {drawerLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.to}
                      onClick={() => {
                        setIsMoreDrawerOpen(false);
                        navigate(link.to);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight">{link.label}</p>
                        <p className="text-[11px] text-slate-400 truncate">{link.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-colors border border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileLayout;
