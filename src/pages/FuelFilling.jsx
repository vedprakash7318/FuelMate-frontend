import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Fuel, 
  Droplets, 
  User, 
  Truck, 
  Phone, 
  Plus, 
  RefreshCw, 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  Clock, 
  Banknote, 
  Sparkles,
  Zap,
  Check,
  QrCode
} from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatNumber, getErrorMessage } from '../utils/helpers';
import Modal from '../components/common/Modal';
import ReceiptModal from '../components/common/ReceiptModal';
import SearchableSelect from '../components/common/SearchableSelect';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const DEFAULT_VEHICLE_TYPES = [
  'Truck', 'Car', 'Bus', 'Tractor', 'Pickup', 'Commercial Vehicle', 'Auto', 'Two Wheeler', 'Other'
];

const FuelFilling = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();

  const [owners, setOwners] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [prices, setPrices] = useState({ Petrol: 96.72, Diesel: 89.62 });
  const [fuelTypesList, setFuelTypesList] = useState(['Diesel', 'Petrol']);
  const [vehicleTypesList, setVehicleTypesList] = useState(DEFAULT_VEHICLE_TYPES);

  // Form State
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [quantity, setQuantity] = useState('');
  const [paymentType, setPaymentType] = useState('Credit'); // 'Credit' | 'Partial Payment' | 'Full Payment'
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'UPI'
  const [amountReceived, setAmountReceived] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [remark, setRemark] = useState('');

  const [loading, setLoading] = useState(false);

  // Quick Inline Add Modals
  const [isAddOwnerModalOpen, setIsAddOwnerModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [newOwnerForm, setNewOwnerForm] = useState({
    name: '', mobile: '', address: '', city: '', state: '', pinCode: '', companyName: ''
  });
  const [newVehicleForm, setNewVehicleForm] = useState({
    vehicleNumber: '',
    vehicleName: '',
    vehicleType: 'Truck',
    customVehicleType: '',
    fuelTypes: ['Diesel'],
    driverName: '',
    driverMobile: '',
  });

  // Add Fuel Type Modal
  const [isAddFuelTypeModalOpen, setIsAddFuelTypeModalOpen] = useState(false);
  const [newFuelTypeName, setNewFuelTypeName] = useState('');
  const [newFuelTypePrice, setNewFuelTypePrice] = useState('');
  const [savingFuelType, setSavingFuelType] = useState(false);

  // Receipt Modal State
  const [receiptTxn, setReceiptTxn] = useState(null);

  // Load custom vehicle types from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('petrol_custom_vehicle_types');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVehicleTypesList(Array.from(new Set([...DEFAULT_VEHICLE_TYPES, ...parsed])));
      } catch (e) {}
    }
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [ownersRes, vehiclesRes, pricesRes, settingsRes] = await Promise.all([
        api.get('/owners'),
        api.get('/vehicles'),
        api.get('/fuel-prices/current'),
        api.get('/settings'),
      ]);

      if (ownersRes.data?.success) setOwners(ownersRes.data.data);
      if (vehiclesRes.data?.success) setVehicles(vehiclesRes.data.data);
      if (pricesRes.data?.success && pricesRes.data.data) {
        const pData = pricesRes.data.data;
        setPrices(pData);
        if (pData.fuelTypes && Array.isArray(pData.fuelTypes)) {
          setFuelTypesList(pData.fuelTypes.filter((f) => f && f.toLowerCase() !== 'both'));
        }
      }
      if (settingsRes.data?.success && settingsRes.data?.data?.customVehicleTypes) {
        const combined = Array.from(new Set([...DEFAULT_VEHICLE_TYPES, ...settingsRes.data.data.customVehicleTypes]));
        setVehicleTypesList(combined);
      }
    } catch (err) {
      toast.error('Failed to load initial data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to extract clean array of fuel types from a vehicle
  const getVehicleFuels = (v) => {
    if (!v) return [];
    if (Array.isArray(v.fuelTypes) && v.fuelTypes.length > 0) {
      return v.fuelTypes.filter((f) => f && f.toLowerCase() !== 'both');
    }
    if (typeof v.fuelType === 'string' && v.fuelType.trim()) {
      return v.fuelType
        .split(',')
        .map((s) => s.trim())
        .filter((f) => f && f.toLowerCase() !== 'both');
    }
    return [];
  };

  // Helper to resolve live rate for any fuel product
  const getRateForFuel = (f) => {
    if (!f) return 90.00;
    if (prices[f] !== undefined && typeof prices[f] === 'number') return prices[f];
    const matchKey = Object.keys(prices).find((k) => k.toLowerCase() === f.toLowerCase());
    if (matchKey && typeof prices[matchKey] === 'number') return prices[matchKey];
    if (f.toLowerCase().includes('petrol')) return prices.Petrol || 96.72;
    if (f.toLowerCase().includes('diesel')) return prices.Diesel || 89.62;
    return 90.00;
  };

  // Filter vehicles when owner changes
  useEffect(() => {
    if (selectedOwnerId) {
      const matchVehicles = vehicles.filter(
        (v) => (v.ownerId?._id === selectedOwnerId || v.ownerId === selectedOwnerId) && v.status === 'active'
      );
      setFilteredVehicles(matchVehicles);
      if (matchVehicles.length > 0) {
        setSelectedVehicleId(matchVehicles[0]._id);
        const v = matchVehicles[0];
        const vFuels = getVehicleFuels(v);
        if (vFuels.length > 0 && !vFuels.includes(fuelType)) {
          setFuelType(vFuels[0]);
        }
      } else {
        setSelectedVehicleId('');
      }
    } else {
      setFilteredVehicles([]);
      setSelectedVehicleId('');
    }
  }, [selectedOwnerId, vehicles]);

  // When vehicle selected, auto-select compatible fuel if current is not supported
  const handleVehicleChange = (vId) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find((item) => item._id === vId);
    if (v) {
      const vFuels = getVehicleFuels(v);
      if (vFuels.length > 0 && !vFuels.includes(fuelType)) {
        setFuelType(vFuels[0]);
      }
    }
  };

  const selectedOwner = owners.find((o) => o._id === selectedOwnerId);
  const selectedVehicle = vehicles.find((v) => v._id === selectedVehicleId);

  // Fuels configured for the currently selected vehicle
  const vehicleFuels = getVehicleFuels(selectedVehicle);

  // When a vehicle is selected, ONLY show the fuel types registered for that vehicle!
  const displayedFuelTypes = (selectedVehicle && vehicleFuels.length > 0)
    ? vehicleFuels
    : fuelTypesList;

  // Ensure fuelType is always one of the selected vehicle's supported fuels
  useEffect(() => {
    if (selectedVehicle) {
      const vFuels = getVehicleFuels(selectedVehicle);
      if (vFuels.length > 0 && !vFuels.includes(fuelType)) {
        setFuelType(vFuels[0]);
      }
    }
  }, [selectedVehicleId, selectedVehicle]);

  // Calculations
  const currentPricePerLiter = getRateForFuel(fuelType);
  const numQuantity = parseFloat(quantity) || 0;
  const totalAmount = Math.round(numQuantity * currentPricePerLiter * 100) / 100;

  let computedReceived = 0;
  if (paymentType === 'Full Payment') {
    computedReceived = totalAmount;
  } else if (paymentType === 'Partial Payment') {
    computedReceived = Math.min(totalAmount, parseFloat(amountReceived) || 0);
  } else {
    computedReceived = 0; // Credit
  }
  const remainingPending = Math.max(0, Math.round((totalAmount - computedReceived) * 100) / 100);

  // Quick preset quantity additions
  const handleAddQty = (add) => {
    const cur = parseFloat(quantity) || 0;
    setQuantity(String(cur + add));
  };

  // Owner options for SearchableSelect
  const ownerOptions = owners.map((o) => ({
    value: o._id,
    label: o.name,
    badge: o.ownerId,
    subtext: `${o.mobile} • Outstanding: ${formatCurrency(o.totalOutstanding)}`,
    searchText: `${o.name} ${o.mobile} ${o.ownerId} ${o.companyName || ''}`,
  }));

  // Vehicle options for SearchableSelect
  const vehicleOptions = filteredVehicles.map((v) => {
    const fuelDisplay = Array.isArray(v.fuelTypes) && v.fuelTypes.length > 0
      ? v.fuelTypes.join(' / ')
      : (v.fuelType || 'Diesel');
    return {
      value: v._id,
      label: v.vehicleNumber,
      badge: fuelDisplay,
      subtext: `${v.vehicleName || v.vehicleType} • Driver: ${v.driverName} (${v.driverMobile}) • Pending: ${formatCurrency(v.pendingBalance)}`,
      searchText: `${v.vehicleNumber} ${v.vehicleName || ''} ${v.vehicleType || ''} ${fuelDisplay} ${v.driverName} ${v.driverMobile}`,
    };
  });

  // Submit Fuel Filling
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOwnerId) {
      toast.error('Please select Customer Owner');
      return;
    }
    if (!selectedVehicleId) {
      toast.error('Please select Vehicle');
      return;
    }
    if (!numQuantity || numQuantity <= 0) {
      toast.error('Please enter valid quantity in liters');
      return;
    }

    if (paymentType === 'Partial Payment') {
      const numReceived = parseFloat(amountReceived) || 0;
      if (numReceived <= 0) {
        toast.error('Please enter received amount for partial payment');
        return;
      }
      if (numReceived > totalAmount) {
        toast.error('Received amount cannot exceed total fuel amount');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ownerId: selectedOwnerId,
        vehicleId: selectedVehicleId,
        fuelType,
        quantity: numQuantity,
        paymentType,
        amountReceived: computedReceived,
        paymentMode: computedReceived > 0 ? paymentMode : undefined,
        transactionRef: (computedReceived > 0 && paymentMode === 'UPI' && transactionRef.trim()) ? transactionRef.trim() : undefined,
        remark: remark.trim() || undefined,
      };

      const res = await api.post('/fuel', payload);
      if (res.data?.success) {
        toast.success('Fuel filling transaction recorded successfully');
        setReceiptTxn(res.data.data);
        // Reset inputs
        setQuantity('');
        setAmountReceived('');
        setTransactionRef('');
        setPaymentMode('Cash');
        setRemark('');
        setPaymentType('Credit');
        // Refresh owners data to update balances
        fetchData();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Inline Owner Creation
  const handleCreateOwner = async (e) => {
    e.preventDefault();
    if (!newOwnerForm.name || !newOwnerForm.mobile) {
      toast.error('Owner Name and Mobile Number are required');
      return;
    }
    try {
      const { data } = await api.post('/owners', newOwnerForm);
      if (data.success) {
        toast.success(`Customer ${data.data.name} registered`);
        setOwners((prev) => [data.data, ...prev]);
        setSelectedOwnerId(data.data._id);
        setIsAddOwnerModalOpen(false);
        setNewOwnerForm({
          name: '', mobile: '', address: '', city: '', state: '', pinCode: '', companyName: ''
        });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Inline Vehicle Creation (Always status: active by default)
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!selectedOwnerId) {
      toast.error('First select an owner');
      return;
    }
    if (!newVehicleForm.vehicleNumber || !newVehicleForm.driverName || !newVehicleForm.driverMobile) {
      toast.error('Vehicle Number, Driver Name & Driver Mobile are required');
      return;
    }
    if (!newVehicleForm.fuelTypes || newVehicleForm.fuelTypes.length === 0) {
      toast.error('Please select at least one fuel type');
      return;
    }

    // Resolve vehicle type if "Other" was chosen
    let finalVehicleType = newVehicleForm.vehicleType;
    if (finalVehicleType === 'Other') {
      if (!newVehicleForm.customVehicleType.trim()) {
        toast.error('Please enter custom vehicle type');
        return;
      }
      finalVehicleType = newVehicleForm.customVehicleType.trim();

      // Save custom vehicle type into state & localStorage
      const updatedTypes = Array.from(new Set([...vehicleTypesList, finalVehicleType]));
      setVehicleTypesList(updatedTypes);
      localStorage.setItem('petrol_custom_vehicle_types', JSON.stringify(updatedTypes));
    }

    try {
      const payload = {
        ownerId: selectedOwnerId,
        vehicleNumber: newVehicleForm.vehicleNumber,
        vehicleName: newVehicleForm.vehicleName || finalVehicleType,
        vehicleType: finalVehicleType,
        fuelTypes: newVehicleForm.fuelTypes,
        fuelType: newVehicleForm.fuelTypes.join(', '),
        driverName: newVehicleForm.driverName,
        driverMobile: newVehicleForm.driverMobile,
        status: 'active',
      };
      const { data } = await api.post('/vehicles', payload);
      if (data.success) {
        toast.success(`Vehicle ${data.data.vehicleNumber} registered (${finalVehicleType})`);
        setVehicles((prev) => [data.data, ...prev]);
        setSelectedVehicleId(data.data._id);
        setIsAddVehicleModalOpen(false);
        setNewVehicleForm({
          vehicleNumber: '',
          vehicleName: '',
          vehicleType: 'Truck',
          customVehicleType: '',
          fuelTypes: ['Diesel'],
          driverName: '',
          driverMobile: '',
        });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Create New Fuel Type
  const handleCreateFuelType = async (e) => {
    e.preventDefault();
    if (!newFuelTypeName.trim() || !newFuelTypePrice) {
      toast.error('Fuel type name and rate are required');
      return;
    }
    const rateNum = parseFloat(newFuelTypePrice);
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error('Please enter a valid rate');
      return;
    }

    setSavingFuelType(true);
    try {
      const trimmedName = newFuelTypeName.trim();
      const res = await api.post('/fuel-prices', {
        fuelType: trimmedName,
        price: rateNum,
      });
      if (res.data?.success) {
        toast.success(`New fuel type "${trimmedName}" created at ₹${rateNum.toFixed(2)}/L`);
        setFuelTypesList((prev) => Array.from(new Set([...prev, trimmedName])));
        setPrices((prev) => ({ ...prev, [trimmedName]: rateNum }));
        setFuelType(trimmedName);
        setIsAddFuelTypeModalOpen(false);
        setNewFuelTypeName('');
        setNewFuelTypePrice('');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingFuelType(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Fuel className="w-5 h-5" />
            </span>
            <span>Fuel Filling Entry</span>
          </h2>
          <p className="text-xs text-slate-500">Record fuel filling with live calculation & ledger update</p>
        </div>
        <button
          onClick={() => navigate('/fuel')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <span>View Entries</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Step 1: Searchable Owner Dropdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <SearchableSelect
            label="1. Select Customer Owner"
            options={ownerOptions}
            value={selectedOwnerId}
            onChange={(val) => setSelectedOwnerId(val)}
            placeholder="Search Owner by Name, Mobile, ID..."
            searchPlaceholder="Type customer name, phone or ID..."
            required
            onAddNew={() => setIsAddOwnerModalOpen(true)}
            addNewText="+ New Owner"
            icon={<User className="w-4 h-4 text-slate-400" />}
            emptyMessage="No customer found matching search"
          />

          {/* Owner details pill */}
          {selectedOwner && (
            <div className="mt-2.5 p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-blue-900">{selectedOwner.name}</span>
                <span className="text-blue-600 ml-2 inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 inline" />
                  <span>{selectedOwner.mobile}</span>
                </span>
                {selectedOwner.companyName && (
                  <span className="text-slate-400 ml-1.5">• {selectedOwner.companyName}</span>
                )}
              </div>
              <span className="font-extrabold text-rose-700 font-mono">
                Outstanding: {formatCurrency(selectedOwner.totalOutstanding)}
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Searchable Vehicle Dropdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          {!selectedOwnerId ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                2. Select Vehicle *
              </label>
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Please select an owner above to see their vehicles
              </div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="py-2 text-center">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-left">
                2. Select Vehicle *
              </label>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800 font-semibold mb-2">
                  No active vehicle registered for this customer
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(true)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New Vehicle Now</span>
                </button>
              </div>
            </div>
          ) : (
            <SearchableSelect
              label="2. Select Vehicle"
              options={vehicleOptions}
              value={selectedVehicleId}
              onChange={(val) => handleVehicleChange(val)}
              placeholder="Search by Vehicle Number, Model, Driver..."
              searchPlaceholder="Type vehicle plate no. or driver name..."
              required
              onAddNew={() => setIsAddVehicleModalOpen(true)}
              addNewText="+ Add Vehicle"
              icon={<Truck className="w-4 h-4 text-slate-400" />}
              emptyMessage="No vehicle found matching search"
            />
          )}

          {selectedVehicle && (
            <div className="mt-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="number-plate text-[10px]">{selectedVehicle.vehicleNumber}</span>
                <span className="text-slate-600 font-medium">
                  {selectedVehicle.vehicleType} • Driver: <span className="font-semibold">{selectedVehicle.driverName}</span> ({selectedVehicle.driverMobile})
                </span>
                <StatusBadge
                  status={selectedVehicle.fuelTypes && selectedVehicle.fuelTypes.length > 0 ? selectedVehicle.fuelTypes : selectedVehicle.fuelType}
                  type="fuel"
                  size="sm"
                />
              </div>
              <span className="text-slate-500 font-semibold font-mono whitespace-nowrap">
                Vehicle Pending: {formatCurrency(selectedVehicle.pendingBalance)}
              </span>
            </div>
          )}
        </div>

        {/* Step 3: Dynamic Fuel Type Selection - ONLY show fuels supported by selected vehicle */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Fuel Type & Live Rate
              </label>
              {selectedVehicle && vehicleFuels.length > 0 && (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  {vehicleFuels.length} {vehicleFuels.length === 1 ? 'fuel' : 'fuels'} for {selectedVehicle.vehicleNumber}
                </span>
              )}
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsAddFuelTypeModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Fuel Type</span>
              </button>
            )}
          </div>

          <div className={`grid gap-2.5 ${
            displayedFuelTypes.length === 1
              ? 'grid-cols-1 sm:grid-cols-2 max-w-xs'
              : displayedFuelTypes.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3'
          }`}>
            {displayedFuelTypes.map((fType) => {
              const isSelected = fuelType === fType || fuelType.toLowerCase() === fType.toLowerCase();
              const rate = getRateForFuel(fType);
              const isPetrol = fType.toLowerCase().includes('petrol');
              const isDiesel = fType.toLowerCase().includes('diesel');

              return (
                <button
                  key={fType}
                  type="button"
                  onClick={() => setFuelType(fType)}
                  className={`p-3 rounded-2xl border-2 flex flex-col justify-between transition-all tap-active text-left ${
                    isSelected
                      ? isPetrol
                        ? 'border-amber-600 bg-amber-50/80 text-amber-950 shadow-sm'
                        : isDiesel
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm'
                        : 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isPetrol ? 'bg-amber-100 text-amber-700' : isDiesel ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isPetrol ? <Fuel className="w-4 h-4" /> : isDiesel ? <Droplets className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Rate</span>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase leading-tight truncate">{fType}</p>
                    <p className="text-sm font-black font-mono mt-0.5 text-slate-900">
                      ₹{Number(rate).toFixed(2)}/L
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Quantity & Live Calculator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            4. Quantity in Liters *
          </label>

          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-extrabold text-slate-900 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              LITERS
            </span>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[5, 10, 20, 50, 100].map((lit) => (
              <button
                key={lit}
                type="button"
                onClick={() => handleAddQty(lit)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
              >
                +{lit}L
              </button>
            ))}
            <button
              type="button"
              onClick={() => setQuantity('')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold"
            >
              Clear
            </button>
          </div>

          {/* Big Live Calculation Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-md">
            <div>
              <p className="text-[11px] text-slate-300 uppercase font-semibold">Total Fuel Amount</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {numQuantity} L × ₹{currentPricePerLiter}/L ({fuelType})
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Step 5: Immediate Payment / Khata Credit Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            5. Payment Settlement Mode
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Credit', label: 'Khata Credit', icon: FileText },
              { id: 'Full Payment', label: 'Full Payment', icon: Banknote },
              { id: 'Partial Payment', label: 'Partial Pay', icon: Clock },
            ].map((mode) => {
              const IconComp = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPaymentType(mode.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                    paymentType === mode.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-extrabold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${paymentType === mode.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-center">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Payment Details when money is received (Full Payment or Partial Payment) */}
          {(paymentType === 'Full Payment' || paymentType === 'Partial Payment') && (
            <div className="space-y-3 pt-1 animate-in fade-in">
              {paymentType === 'Partial Payment' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Amount Received Now (₹) *
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Max: {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={totalAmount}
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="Enter received amount"
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
                      required
                    />
                  </div>
                  {/* Quick percentage helpers */}
                  <div className="flex gap-1.5 mt-1.5">
                    {[0.25, 0.5, 0.75].map((pct) => {
                      const val = Math.round(totalAmount * pct);
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setAmountReceived(String(val))}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          {pct * 100}% (₹{val})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Mode (Cash / UPI) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
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

              {/* UPI UTR / Reference Number */}
              {paymentMode === 'UPI' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 animate-in fade-in">
                  <label className="block text-xs font-bold text-blue-900">
                    UPI Reference ID / UTR Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. 431092837241 or GPay ref"
                    className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[10px] text-blue-600">
                    Enter the 12-digit UPI UTR or bank reference number from the customer payment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Settlement / Outstanding Indicators */}
          {paymentType === 'Full Payment' ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <div>
                  <span className="font-bold text-emerald-900">Fully Settled at Counter</span>
                  <p className="text-[11px] text-emerald-700">₹0.00 added to customer khata</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-emerald-900 font-mono">
                Paid: {formatCurrency(computedReceived)}
              </span>
            </div>
          ) : paymentType === 'Partial Payment' ? (
            <div className="space-y-2 animate-in fade-in">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800">Received Now ({paymentMode}):</span>
                <span className="text-sm font-extrabold text-emerald-900 font-mono">
                  {formatCurrency(computedReceived)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                <span className="font-bold text-rose-800">Added to Khata Outstanding:</span>
                <span className="text-base font-extrabold text-rose-900 font-mono">
                  {formatCurrency(remainingPending)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs animate-in fade-in">
              <span className="font-bold text-rose-800">Added to Khata Outstanding:</span>
              <span className="text-base font-extrabold text-rose-900 font-mono">
                {formatCurrency(remainingPending)}
              </span>
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
              placeholder="e.g. Pump No. 2, Night shift"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || totalAmount <= 0}
          className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-emerald-600/30 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Fuel className="w-5 h-5" />
          )}
          <span>{loading ? 'Saving Fuel Transaction...' : 'Save Fuel Entry'}</span>
        </button>
      </form>

      {/* Digital Receipt Modal on successful save */}
      <ReceiptModal
        isOpen={Boolean(receiptTxn)}
        onClose={() => setReceiptTxn(null)}
        txn={receiptTxn}
      />

      {/* Quick Add Owner Modal */}
      <Modal
        isOpen={isAddOwnerModalOpen}
        onClose={() => setIsAddOwnerModalOpen(false)}
        title="Quick Add Customer Owner"
        subtitle="Register customer khata account"
      >
        <form onSubmit={handleCreateOwner} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name *</label>
            <input
              type="text"
              value={newOwnerForm.name}
              onChange={(e) => setNewOwnerForm({ ...newOwnerForm, name: e.target.value })}
              placeholder="e.g. Rajesh Kumar"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
            <input
              type="tel"
              value={newOwnerForm.mobile}
              onChange={(e) => setNewOwnerForm({ ...newOwnerForm, mobile: e.target.value })}
              placeholder="10-digit mobile"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address (Optional)</label>
            <input
              type="text"
              value={newOwnerForm.address}
              onChange={(e) => setNewOwnerForm({ ...newOwnerForm, address: e.target.value })}
              placeholder="e.g. Transport Nagar"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm mt-2"
          >
            Save Owner & Continue
          </button>
        </form>
      </Modal>

      {/* Quick Add Vehicle Modal: Default Active, custom vehicle type input on "Other" */}
      <Modal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        title="Register New Vehicle"
        subtitle="Add vehicle to customer khata account"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration Number *</label>
            <input
              type="text"
              value={newVehicleForm.vehicleNumber}
              onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicleNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. UP 32 AB 1234"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
            <select
              value={newVehicleForm.vehicleType}
              onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicleType: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              {vehicleTypesList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Supported Fuel Types * <span className="text-[11px] text-slate-400 font-normal lowercase">(multi-select)</span>
              </label>
              <span className="text-[11px] font-semibold text-purple-600">
                {newVehicleForm.fuelTypes.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from(new Set(['Diesel', 'Petrol', ...fuelTypesList]))
                .filter((ft) => ft && ft.toLowerCase() !== 'both')
                .map((ft) => {
                  const isSelected = newVehicleForm.fuelTypes.includes(ft);
                  const isPetrol = ft.toLowerCase().includes('petrol');
                  const isDiesel = ft.toLowerCase().includes('diesel');
                  const IconComp = isPetrol ? Fuel : isDiesel ? Droplets : Zap;

                  return (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => {
                        const exists = newVehicleForm.fuelTypes.includes(ft);
                        if (exists) {
                          if (newVehicleForm.fuelTypes.length === 1) {
                            toast.error('At least one fuel type must be selected');
                            return;
                          }
                          setNewVehicleForm({
                            ...newVehicleForm,
                            fuelTypes: newVehicleForm.fuelTypes.filter((x) => x !== ft),
                          });
                        } else {
                          setNewVehicleForm({
                            ...newVehicleForm,
                            fuelTypes: [...newVehicleForm.fuelTypes, ft],
                          });
                        }
                      }}
                      className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-between transition-all select-none ${
                        isSelected
                          ? isPetrol
                            ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                            : isDiesel
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs'
                            : 'border-blue-500 bg-blue-50 text-blue-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <IconComp className={`w-3.5 h-3.5 ${
                          isSelected
                            ? isPetrol ? 'text-amber-600' : isDiesel ? 'text-emerald-600' : 'text-blue-600'
                            : 'text-slate-400'
                        }`} />
                        <span className="truncate">{ft}</span>
                      </div>
                      {isSelected && (
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isPetrol ? 'bg-amber-600 text-white' : isDiesel ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Select all fuels this vehicle can use.
            </p>
          </div>

          {/* When "Other" is chosen: text input to write and create custom vehicle type */}
          {newVehicleForm.vehicleType === 'Other' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl animate-in fade-in space-y-1">
              <label className="block text-xs font-bold text-purple-900">
                Custom Vehicle Type Name (e.g. JCB, Dumper, Tanker, Crane) *
              </label>
              <input
                type="text"
                value={newVehicleForm.customVehicleType}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, customVehicleType: e.target.value })}
                placeholder="Enter new vehicle type"
                className="w-full p-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                required
              />
              <p className="text-[10px] text-purple-600">
                Once saved, this new vehicle type will be registered and available in the list.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name *</label>
              <input
                type="text"
                value={newVehicleForm.driverName}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, driverName: e.target.value })}
                placeholder="Driver name"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Driver Mobile *</label>
              <input
                type="tel"
                value={newVehicleForm.driverMobile}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, driverMobile: e.target.value })}
                placeholder="Driver 10-digit mobile"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          {/* Active by default indicator */}
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Registration Status: <strong>Active by default</strong></span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm mt-2 shadow-md"
          >
            Save Vehicle & Select
          </button>
        </form>
      </Modal>

      {/* Add Fuel Type Modal */}
      <Modal
        isOpen={isAddFuelTypeModalOpen}
        onClose={() => setIsAddFuelTypeModalOpen(false)}
        title="Create New Fuel Product"
        subtitle="Add custom fuel product (e.g. CNG, Speed, Power, XP95, DEF/AdBlue)"
      >
        <form onSubmit={handleCreateFuelType} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Fuel Product Name *
            </label>
            <input
              type="text"
              value={newFuelTypeName}
              onChange={(e) => setNewFuelTypeName(e.target.value)}
              placeholder="e.g. CNG, Speed, Power, XP95, DEF / AdBlue"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Price Per Liter / Unit (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={newFuelTypePrice}
                onChange={(e) => setNewFuelTypePrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingFuelType}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md mt-2 disabled:opacity-50"
          >
            {savingFuelType ? 'Saving...' : 'Create & Apply Fuel Type'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FuelFilling;
