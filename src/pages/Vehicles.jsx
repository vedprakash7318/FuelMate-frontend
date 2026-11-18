import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Car, Plus, Search, X, Pencil, Settings, User, Phone, Check, Fuel, Droplets, Zap } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatNumber, formatLiters, getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import SearchableSelect from '../components/common/SearchableSelect';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const DEFAULT_VEHICLE_TYPES = [
  'Truck', 'Car', 'Bus', 'Tractor', 'Pickup', 'Commercial Vehicle', 'Auto', 'Two Wheeler', 'Other'
];

const Vehicles = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [owners, setOwners] = useState([]);
  const [fuelTypes, setFuelTypes] = useState(['Diesel', 'Petrol']);
  const [vehicleTypesList, setVehicleTypesList] = useState(DEFAULT_VEHICLE_TYPES);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    ownerId: '',
    vehicleNumber: '',
    vehicleName: '',
    vehicleType: 'Truck',
    customVehicleType: '',
    fuelTypes: ['Diesel'],
    driverName: '',
    driverMobile: '',
    remark: '',
    status: 'active',
  };
  const [formData, setFormData] = useState(initialForm);

  // Manage Vehicle Types Modal (for Admin)
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [newTypeNameInput, setNewTypeNameInput] = useState('');

  // Load custom vehicle types from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('petrol_custom_vehicle_types');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVehicleTypesList(Array.from(new Set([...DEFAULT_VEHICLE_TYPES, ...parsed])));
      } catch (e) {}
    }
  }, []);

  const fetchVehicles = async () => {
    try {
      const [vRes, oRes, pRes, sRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/owners'),
        api.get('/fuel-prices/current'),
        api.get('/settings'),
      ]);
      if (vRes.data?.success) setVehicles(vRes.data.data);
      if (oRes.data?.success) setOwners(oRes.data.data);
      if (pRes.data?.success && pRes.data?.data?.fuelTypes) {
        setFuelTypes(
          Array.from(new Set(['Diesel', 'Petrol', ...pRes.data.data.fuelTypes]))
            .filter((f) => f && f.toLowerCase() !== 'both')
        );
      }
      if (sRes.data?.success && sRes.data?.data?.customVehicleTypes) {
        setVehicleTypesList(Array.from(new Set([...DEFAULT_VEHICLE_TYPES, ...sRes.data.data.customVehicleTypes])));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e, vehicle) => {
    e.stopPropagation();
    setEditingVehicle(vehicle);

    let currentFuelTypes = ['Diesel'];
    if (Array.isArray(vehicle.fuelTypes) && vehicle.fuelTypes.length > 0) {
      currentFuelTypes = vehicle.fuelTypes.filter((f) => f && f.toLowerCase() !== 'both');
    } else if (vehicle.fuelType) {
      currentFuelTypes = vehicle.fuelType
        .split(',')
        .map((s) => s.trim())
        .filter((f) => f && f.toLowerCase() !== 'both');
    }
    if (currentFuelTypes.length === 0) currentFuelTypes = ['Diesel'];

    setFormData({
      ownerId: vehicle.ownerId?._id || vehicle.ownerId,
      vehicleNumber: vehicle.vehicleNumber || '',
      vehicleName: vehicle.vehicleName || '',
      vehicleType: vehicle.vehicleType || 'Truck',
      customVehicleType: '',
      fuelTypes: currentFuelTypes,
      driverName: vehicle.driverName || '',
      driverMobile: vehicle.driverMobile || '',
      remark: vehicle.remark || '',
      status: vehicle.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!formData.ownerId || !formData.vehicleNumber || !formData.driverName || !formData.driverMobile) {
      toast.error('Owner, Vehicle Number, Driver Name, and Driver Mobile are required');
      return;
    }

    if (!formData.fuelTypes || formData.fuelTypes.length === 0) {
      toast.error('Please select at least one fuel type');
      return;
    }

    // Resolve vehicle type if "Other" was written
    let finalType = formData.vehicleType;
    if (finalType === 'Other') {
      if (!formData.customVehicleType.trim()) {
        toast.error('Please enter custom vehicle type name');
        return;
      }
      finalType = formData.customVehicleType.trim();

      // Add to list and persist
      const updated = Array.from(new Set([...vehicleTypesList, finalType]));
      setVehicleTypesList(updated);
      localStorage.setItem('petrol_custom_vehicle_types', JSON.stringify(updated));
    }

    setSubmitting(true);
    try {
      const payload = {
        ownerId: formData.ownerId,
        vehicleNumber: formData.vehicleNumber,
        vehicleName: formData.vehicleName || finalType,
        vehicleType: finalType,
        fuelTypes: formData.fuelTypes,
        fuelType: formData.fuelTypes.join(', '),
        driverName: formData.driverName,
        driverMobile: formData.driverMobile,
        remark: formData.remark,
        status: editingVehicle ? formData.status : 'active',
      };

      if (editingVehicle) {
        const res = await api.put(`/vehicles/${editingVehicle._id}`, payload);
        if (res.data?.success) {
          toast.success('Vehicle updated successfully');
        }
      } else {
        const res = await api.post('/vehicles', payload);
        if (res.data?.success) {
          toast.success(`Vehicle ${formData.vehicleNumber} registered (${finalType})`);
        }
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Add new vehicle type from Admin modal
  const handleAddNewType = (e) => {
    e.preventDefault();
    const trimmed = newTypeNameInput.trim();
    if (!trimmed) return;
    const updated = Array.from(new Set([...vehicleTypesList, trimmed]));
    setVehicleTypesList(updated);
    localStorage.setItem('petrol_custom_vehicle_types', JSON.stringify(updated));
    toast.success(`Vehicle type "${trimmed}" created`);
    setNewTypeNameInput('');
  };

  const ownerOptions = owners.map((o) => ({
    value: o._id,
    label: o.name,
    badge: o.ownerId,
    subtext: `${o.mobile} • Outstanding: ${formatCurrency(o.totalOutstanding)}`,
    searchText: `${o.name} ${o.mobile} ${o.ownerId} ${o.companyName || ''}`,
  }));

  const filteredVehicles = vehicles.filter((v) => {
    const s = search.toLowerCase();
    const matchSearch =
      v.vehicleNumber?.toLowerCase().includes(s) ||
      v.ownerId?.name?.toLowerCase().includes(s) ||
      v.driverName?.toLowerCase().includes(s) ||
      v.vehicleType?.toLowerCase().includes(s);

    if (!matchSearch) return false;
    if (typeFilter !== 'all' && v.vehicleType !== typeFilter) return false;
    return true;
  });

  if (loading) return <LoadingSpinner text="Loading Vehicles..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </span>
            <span>Registered Vehicles</span>
          </h2>
          <p className="text-xs text-slate-500">{vehicles.length} fleet vehicles registered</p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setIsManageTypesOpen(true)}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              title="Manage Vehicle Types"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Types</span>
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Vehicle No, Owner or Driver..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['all', ...vehicleTypesList.filter((t) => t !== 'Other')].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              typeFilter === t
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t === 'all' ? `All (${vehicles.length})` : t}
          </button>
        ))}
      </div>

      {/* Vehicle Cards List */}
      <div className="space-y-2.5">
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 mt-2">No vehicles found</h3>
            <p className="text-xs text-slate-400 mt-1">Try another search or register a new vehicle</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div
              key={vehicle._id}
              onClick={() => navigate(`/vehicles/${vehicle._id}`)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all tap-active group relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-lg shadow-xs flex-shrink-0">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="number-plate text-xs font-bold">
                        {vehicle.vehicleNumber}
                      </span>
                      <StatusBadge status={vehicle.fuelTypes && vehicle.fuelTypes.length > 0 ? vehicle.fuelTypes : vehicle.fuelType} type="fuel" />
                      <StatusBadge status={vehicle.status} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {vehicle.vehicleName || vehicle.vehicleType}
                      <span className="text-slate-400 font-normal ml-1">
                        • Owner: <span className="font-semibold text-blue-600">{vehicle.ownerId?.name || 'N/A'}</span>
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleOpenEdit(e, vehicle)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  title="Edit Vehicle"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Row */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-600 font-medium">
                    Driver: <span className="font-bold text-slate-800">{vehicle.driverName}</span> ({vehicle.driverMobile})
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Type: <span className="font-semibold">{vehicle.vehicleType}</span> • Consumed: {formatLiters(vehicle.totalFuelConsumed)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Pending Balance</p>
                  <p className={`text-sm font-extrabold font-mono ${
                    vehicle.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {formatCurrency(vehicle.pendingBalance)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
        subtitle="Add vehicle to customer khata account"
      >
        <form onSubmit={handleSaveVehicle} className="space-y-3.5">
          {/* Searchable Owner Selector */}
          <SearchableSelect
            label="Select Customer Owner"
            options={ownerOptions}
            value={formData.ownerId}
            onChange={(val) => setFormData({ ...formData, ownerId: val })}
            placeholder="Search Owner by Name, Mobile, ID..."
            searchPlaceholder="Type customer name, phone or ID..."
            required
            icon={<User className="w-4 h-4 text-slate-400" />}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Vehicle Registration Number *
            </label>
            <input
              type="text"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. UP 32 AB 1234"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vehicle Name / Model
              </label>
              <input
                type="text"
                value={formData.vehicleName}
                onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                placeholder="e.g. Tata Signa 4825"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vehicle Type *
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                required
              >
                {vehicleTypesList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* When "Other" is chosen: text input to write and create custom vehicle type */}
          {formData.vehicleType === 'Other' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl animate-in fade-in space-y-1">
              <label className="block text-xs font-bold text-purple-900">
                Custom Vehicle Type Name (e.g. JCB, Dumper, Tanker, Crane, Roller) *
              </label>
              <input
                type="text"
                value={formData.customVehicleType}
                onChange={(e) => setFormData({ ...formData, customVehicleType: e.target.value })}
                placeholder="Enter new vehicle type"
                className="w-full p-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                required
              />
              <p className="text-[10px] text-purple-600">
                This vehicle type will be saved for this vehicle and added to your pump types.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Supported Fuel Types * <span className="text-[11px] text-slate-400 font-normal lowercase">(multi-select)</span>
              </label>
              <span className="text-[11px] font-semibold text-purple-600">
                {formData.fuelTypes.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fuelTypes.map((ft) => {
                const isSelected = formData.fuelTypes.includes(ft);
                const isPetrol = ft.toLowerCase().includes('petrol');
                const isDiesel = ft.toLowerCase().includes('diesel');
                const IconComp = isPetrol ? Fuel : isDiesel ? Droplets : Zap;

                return (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => {
                      const exists = formData.fuelTypes.includes(ft);
                      if (exists) {
                        if (formData.fuelTypes.length === 1) {
                          toast.error('At least one fuel type must be selected');
                          return;
                        }
                        setFormData({
                          ...formData,
                          fuelTypes: formData.fuelTypes.filter((x) => x !== ft),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          fuelTypes: [...formData.fuelTypes, ft],
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
              Select all fuels this vehicle can use (e.g. Petrol + CNG, Diesel + AdBlue).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Driver Name *
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="Driver Name"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Driver Mobile *
              </label>
              <input
                type="tel"
                value={formData.driverMobile}
                onChange={(e) => setFormData({ ...formData, driverMobile: e.target.value })}
                placeholder="Driver 10-digit mobile"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Remark / Notes (Optional)</label>
            <input
              type="text"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="e.g. Dedicated for sand loading"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* If registering new, by default Active */}
          {editingVehicle ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Vehicle Status: <strong>Active by default</strong></span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md mt-2 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Save & Register Vehicle'}
          </button>
        </form>
      </Modal>

      {/* Admin Manage Vehicle Types Modal */}
      <Modal
        isOpen={isManageTypesOpen}
        onClose={() => setIsManageTypesOpen(false)}
        title="Vehicle Types Management"
        subtitle="Custom fleet categories for your petrol pump"
      >
        <div className="space-y-4">
          <form onSubmit={handleAddNewType} className="flex gap-2">
            <input
              type="text"
              value={newTypeNameInput}
              onChange={(e) => setNewTypeNameInput(e.target.value)}
              placeholder="Add new type (e.g. JCB, Dumper, Tanker, Generator)..."
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-xs shadow hover:bg-purple-700 flex-shrink-0"
            >
              + Add Type
            </button>
          </form>

          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Vehicle Types ({vehicleTypesList.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {vehicleTypesList.map((type) => (
                <span
                  key={type}
                  className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Vehicles;
