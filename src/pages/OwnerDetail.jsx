import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Users,
  Truck,
  Fuel,
  Wallet,
  MessageSquare,
  Phone,
  MapPin,
  BookOpen,
  FileText,
  FileSpreadsheet,
  Plus,
  Check,
  Droplets,
  Zap
} from 'lucide-react';
import api from '../utils/api';
import {
  formatCurrency, formatNumber, formatDate, formatDateTime,
  formatLiters, generateWhatsAppLink, getErrorMessage
} from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const OwnerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pumpSettings } = useAuth();

  const [owner, setOwner] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [ledgerData, setLedgerData] = useState(null);
  const [fuelHistory, setFuelHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'vehicles' | 'fuel' | 'payments'
  const [loading, setLoading] = useState(true);

  // Add Vehicle Modal
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [vehicleTypesList, setVehicleTypesList] = useState([
    'Truck', 'Car', 'Bus', 'Tractor', 'Pickup', 'Commercial Vehicle', 'Auto', 'Two Wheeler', 'Other'
  ]);
  const [fuelTypesList, setFuelTypesList] = useState(['Diesel', 'Petrol']);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleName: '',
    vehicleType: 'Truck',
    customVehicleType: '',
    fuelTypes: ['Diesel'],
    driverName: '',
    driverMobile: '',
    remark: '',
  });

  // Load custom vehicle types and fuel types
  useEffect(() => {
    const saved = localStorage.getItem('petrol_custom_vehicle_types');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVehicleTypesList(Array.from(new Set(['Truck', 'Car', 'Bus', 'Tractor', 'Pickup', 'Commercial Vehicle', 'Auto', 'Two Wheeler', 'Other', ...parsed])));
      } catch (e) {}
    }
    api.get('/fuel-prices/current')
      .then((res) => {
        if (res.data?.success && res.data?.data?.fuelTypes) {
          setFuelTypesList(
            Array.from(new Set(['Diesel', 'Petrol', ...res.data.data.fuelTypes]))
              .filter((f) => f && f.toLowerCase() !== 'both')
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      const [ownerRes, vehiclesRes, ledgerRes, fuelRes, paymentsRes] = await Promise.all([
        api.get(`/owners/${id}`),
        api.get(`/owners/${id}/vehicles`),
        api.get(`/ledger/owner/${id}`),
        api.get(`/fuel?ownerId=${id}`),
        api.get(`/payments?ownerId=${id}`),
      ]);

      if (ownerRes.data?.success) setOwner(ownerRes.data.data);
      if (vehiclesRes.data?.success) setVehicles(vehiclesRes.data.data);
      if (ledgerRes.data?.success) setLedgerData(ledgerRes.data);
      if (fuelRes.data?.success) setFuelHistory(fuelRes.data.data);
      if (paymentsRes.data?.success) setPaymentHistory(paymentsRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNumber || !vehicleForm.driverName || !vehicleForm.driverMobile) {
      toast.error('Vehicle Number, Driver Name, and Driver Mobile are required');
      return;
    }

    if (!vehicleForm.fuelTypes || vehicleForm.fuelTypes.length === 0) {
      toast.error('Please select at least one fuel type');
      return;
    }

    let finalType = vehicleForm.vehicleType;
    if (finalType === 'Other') {
      if (!vehicleForm.customVehicleType.trim()) {
        toast.error('Please enter custom vehicle type name');
        return;
      }
      finalType = vehicleForm.customVehicleType.trim();
      const updated = Array.from(new Set([...vehicleTypesList, finalType]));
      setVehicleTypesList(updated);
      localStorage.setItem('petrol_custom_vehicle_types', JSON.stringify(updated));
    }

    try {
      const res = await api.post('/vehicles', {
        ownerId: id,
        vehicleNumber: vehicleForm.vehicleNumber,
        vehicleName: vehicleForm.vehicleName || finalType,
        vehicleType: finalType,
        fuelTypes: vehicleForm.fuelTypes,
        fuelType: vehicleForm.fuelTypes.join(', '),
        driverName: vehicleForm.driverName,
        driverMobile: vehicleForm.driverMobile,
        remark: vehicleForm.remark,
        status: 'active',
      });
      if (res.data?.success) {
        toast.success(`Vehicle ${vehicleForm.vehicleNumber} registered (${finalType})`);
        setIsAddVehicleOpen(false);
        setVehicleForm({
          vehicleNumber: '',
          vehicleName: '',
          vehicleType: 'Truck',
          customVehicleType: '',
          fuelTypes: ['Diesel'],
          driverName: '',
          driverMobile: '',
          remark: '',
        });
        fetchData();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Export PDF Ledger
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pumpName = pumpSettings?.pumpName || 'Petrol Pump Khata Manager';
      
      // Header
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text(pumpName, 14, 18);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(pumpSettings?.address || 'Fuel Station Khata Statement', 14, 24);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 29);

      // Customer Details Box
      doc.setDrawColor(200);
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(14, 34, 182, 22, 2, 2, 'FD');
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Customer: ${owner?.name} (${owner?.ownerId})`, 18, 42);
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Mobile: ${owner?.mobile} | Company: ${owner?.companyName || 'N/A'}`, 18, 48);
      doc.setFontSize(11);
      doc.setTextColor(180, 0, 0);
      doc.text(`Current Outstanding: ${formatCurrency(owner?.totalOutstanding)}`, 110, 44);

      // Table Data
      const tableRows = (ledgerData?.ledger || []).map((row) => [
        formatDate(row.date),
        row.refId || '-',
        row.description || '-',
        row.debit > 0 ? `₹${formatNumber(row.debit)}` : '-',
        row.credit > 0 ? `₹${formatNumber(row.credit)}` : '-',
        `₹${formatNumber(row.balance)}`,
      ]);

      doc.autoTable({
        startY: 60,
        head: [['Date', 'Ref / Slip', 'Description', 'Debit', 'Credit', 'Balance']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { halign: 'right', textColor: [180, 0, 0] },
          4: { halign: 'right', textColor: [0, 130, 0] },
          5: { halign: 'right', fontStyle: 'bold' },
        },
      });

      doc.save(`${owner?.name?.replace(/\s+/g, '_')}_Khata_Statement.pdf`);
      toast.success('PDF Statement downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    try {
      const data = (ledgerData?.ledger || []).map((row) => ({
        Date: formatDate(row.date),
        Reference: row.refId || '-',
        Description: row.description,
        'Debit (Rs)': row.debit || 0,
        'Credit (Rs)': row.credit || 0,
        'Balance (Rs)': row.balance || 0,
        Vehicle: row.vehicleNumber || '-',
        Staff: row.user || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Khata_Ledger');
      XLSX.writeFile(wb, `${owner?.name?.replace(/\s+/g, '_')}_Khata.xlsx`);
      toast.success('Excel exported successfully');
    } catch (err) {
      toast.error('Failed to export Excel');
    }
  };

  if (loading) return <LoadingSpinner text="Loading Customer Details..." />;
  if (!owner) return <div className="p-6 text-center text-slate-500">Customer not found</div>;

  const waLink = generateWhatsAppLink(
    owner.mobile,
    owner.name,
    owner.totalOutstanding,
    pumpSettings?.pumpName || 'Petrol Pump'
  );

  return (
    <div className="space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/owners')}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Owners</span>
        </button>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
          {owner.ownerId}
        </span>
      </div>

      {/* Customer Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xl shadow-sm flex-shrink-0">
              {owner.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{owner.name}</h2>
                <StatusBadge status={owner.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                {owner.companyName ? `${owner.companyName} • ` : ''}
                <Phone className="w-3 h-3 text-slate-400 inline" />
                <span>{owner.mobile}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 inline shrink-0" />
                <span>{owner.address}, {owner.city}, {owner.state} ({owner.pinCode})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Big Balance Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
              Total Outstanding Balance
            </p>
            <h3 className="text-2xl font-black text-rose-700 font-mono mt-0.5">
              {formatCurrency(owner.totalOutstanding)}
            </h3>
          </div>
          <div className="text-right text-xs">
            <p className="text-slate-500">Fuel: <span className="font-bold text-slate-700">{formatCurrency(owner.totalFuelAmount)}</span></p>
            <p className="text-emerald-700">Paid: <span className="font-bold">{formatCurrency(owner.totalPayment)}</span></p>
          </div>
        </div>

        {/* Quick Action Buttons for Owner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            onClick={() => navigate('/fuel/new')}
            className="py-2.5 px-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Fuel className="w-4 h-4 text-white" />
            <span>New Fuel</span>
          </button>
          <button
            onClick={() => navigate('/payments/new')}
            className="py-2.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Wallet className="w-4 h-4 text-white" />
            <span>Receive Payment</span>
          </button>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Reminder</span>
            </a>
          ) : (
            <div />
          )}
          {owner.mobile ? (
            <a
              href={`tel:${owner.mobile}`}
              className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>Call Owner</span>
            </a>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
        {[
          { id: 'ledger', label: 'Khata Ledger', icon: BookOpen, badge: ledgerData?.count || 0 },
          { id: 'vehicles', label: `Vehicles (${vehicles.length})`, icon: Truck },
          { id: 'fuel', label: `Fuel (${fuelHistory.length})`, icon: Fuel },
          { id: 'payments', label: `Payments (${paymentHistory.length})`, icon: Wallet },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-xl transition-all text-center truncate flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: KHATA PASSBOOK / LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Khata Passbook</h3>
              <p className="text-[11px] text-slate-400">Debit • Credit • Running Balance</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportPDF}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 border border-rose-200"
                title="Download PDF Statement"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 border border-emerald-200"
                title="Export Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Passbook Feed */}
          {(!ledgerData?.ledger || ledgerData.ledger.length === 0) ? (
            <p className="text-xs text-slate-400 text-center py-8">No ledger entries recorded yet</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {ledgerData.ledger.map((row) => (
                <div key={row.id} className="py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        row.debit > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {row.debit > 0 ? <Fuel className="w-3 h-3 text-rose-700" /> : <Wallet className="w-3 h-3 text-emerald-700" />}
                      </span>
                      <span className="text-xs font-bold text-slate-800" title={row.description}>
                        {row.description}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {row.debit > 0 && (
                      <p className="text-xs font-bold text-rose-600 font-mono">
                        + {formatCurrency(row.debit)}
                      </p>
                    )}
                    {row.credit > 0 && (
                      <p className="text-xs font-bold text-emerald-600 font-mono">
                        - {formatCurrency(row.credit)}
                      </p>
                    )}
                    <p className="text-[11px] font-extrabold text-slate-800 font-mono mt-0.5">
                      Bal: {formatCurrency(row.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Owner's Vehicles ({vehicles.length})</h3>
            <button
              onClick={() => setIsAddVehicleOpen(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
              <Truck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700 mt-2">No vehicles added yet</p>
              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="mt-3 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl"
              >
                + Register First Vehicle
              </button>
            </div>
          ) : (
            vehicles.map((v) => (
              <div
                key={v._id}
                onClick={() => navigate(`/vehicles/${v._id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all tap-active flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="number-plate text-xs">{v.vehicleNumber}</span>
                    <span className="text-xs font-bold text-slate-800">{v.vehicleName || v.vehicleType}</span>
                    <StatusBadge status={v.fuelTypes && v.fuelTypes.length > 0 ? v.fuelTypes : v.fuelType} type="fuel" />
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Driver: <span className="font-semibold text-slate-700">{v.driverName}</span> ({v.driverMobile})
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Type: <span className="font-semibold">{v.vehicleType}</span> • Total Consumed: {formatLiters(v.totalFuelConsumed)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Pending</p>
                  <p className={`text-sm font-extrabold font-mono ${
                    v.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {formatCurrency(v.pendingBalance)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: FUEL HISTORY */}
      {activeTab === 'fuel' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Fuel Filling History</h3>
          <div className="divide-y divide-slate-100">
            {fuelHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No fuel entries found</p>
            ) : (
              fuelHistory.map((txn) => (
                <div key={txn._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="number-plate text-[10px]">{txn.vehicleId?.vehicleNumber || 'VEHICLE'}</span>
                      <StatusBadge status={txn.fuelType} type="fuel" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatLiters(txn.quantity)} @ ₹{txn.pricePerLiter}/L • {formatDateTime(txn.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">{formatCurrency(txn.totalAmount)}</p>
                    <StatusBadge status={txn.paymentType} type="payment" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Payment Deposits</h3>
          <div className="divide-y divide-slate-100">
            {paymentHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No payments recorded</p>
            ) : (
              paymentHistory.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {p.paymentMode} {p.transactionRef ? `(${p.transactionRef})` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDateTime(p.createdAt)} • Ref: {p.paymentId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-600 font-mono">
                      + {formatCurrency(p.amount)}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize">{p.adjustmentType} level</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        title="Add Vehicle to Owner"
        subtitle={`Register vehicle under ${owner.name}`}
      >
        <form onSubmit={handleAddVehicle} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration Number *</label>
            <input
              type="text"
              value={vehicleForm.vehicleNumber}
              onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. UP 32 MN 4567"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model / Nickname</label>
              <input
                type="text"
                value={vehicleForm.vehicleName}
                onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                placeholder="e.g. Tata Signa 4825"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={vehicleForm.vehicleType}
                onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {vehicleTypesList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* When "Other" is chosen: custom vehicle input */}
          {vehicleForm.vehicleType === 'Other' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl animate-in fade-in space-y-1">
              <label className="block text-xs font-bold text-purple-900">
                Custom Vehicle Type Name (e.g. JCB, Dumper, Tanker) *
              </label>
              <input
                type="text"
                value={vehicleForm.customVehicleType}
                onChange={(e) => setVehicleForm({ ...vehicleForm, customVehicleType: e.target.value })}
                placeholder="Enter new vehicle type"
                className="w-full p-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Supported Fuel Types * <span className="text-[11px] text-slate-400 font-normal lowercase">(multi-select)</span>
              </label>
              <span className="text-[11px] font-semibold text-purple-600">
                {vehicleForm.fuelTypes.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fuelTypesList.map((ft) => {
                const isSelected = vehicleForm.fuelTypes.includes(ft);
                const isPetrol = ft.toLowerCase().includes('petrol');
                const isDiesel = ft.toLowerCase().includes('diesel');
                const IconComp = isPetrol ? Fuel : isDiesel ? Droplets : Zap;

                return (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => {
                      const exists = vehicleForm.fuelTypes.includes(ft);
                      if (exists) {
                        if (vehicleForm.fuelTypes.length === 1) {
                          toast.error('At least one fuel type must be selected');
                          return;
                        }
                        setVehicleForm({
                          ...vehicleForm,
                          fuelTypes: vehicleForm.fuelTypes.filter((x) => x !== ft),
                        });
                      } else {
                        setVehicleForm({
                          ...vehicleForm,
                          fuelTypes: [...vehicleForm.fuelTypes, ft],
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name *</label>
              <input
                type="text"
                value={vehicleForm.driverName}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                placeholder="Driver Name"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Driver Mobile Number *</label>
              <input
                type="tel"
                value={vehicleForm.driverMobile}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driverMobile: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Remark / Notes (Optional)</label>
            <input
              type="text"
              value={vehicleForm.remark}
              onChange={(e) => setVehicleForm({ ...vehicleForm, remark: e.target.value })}
              placeholder="Notes"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md mt-2"
          >
            Save Vehicle to Account
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default OwnerDetail;
