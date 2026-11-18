import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, 
  Fuel, 
  Wallet, 
  BookOpen, 
  FileText, 
  FileSpreadsheet, 
  Truck, 
  Phone 
} from 'lucide-react';
import api from '../utils/api';
import {
  formatCurrency, formatNumber, formatDate, formatDateTime,
  formatLiters, getErrorMessage
} from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pumpSettings } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [fuelHistory, setFuelHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger');

  const fetchData = async () => {
    try {
      const [vRes, lRes, fRes] = await Promise.all([
        api.get(`/vehicles/${id}`),
        api.get(`/ledger/vehicle/${id}`),
        api.get(`/fuel?vehicleId=${id}`),
      ]);

      if (vRes.data?.success) setVehicle(vRes.data.data);
      if (lRes.data?.success) setLedgerData(lRes.data);
      if (fRes.data?.success) setFuelHistory(fRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text(pumpSettings?.pumpName || 'Petrol Pump Khata Manager', 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Vehicle Ledger Statement: ${vehicle?.vehicleNumber}`, 14, 25);
      doc.text(`Owner: ${vehicle?.ownerId?.name || 'Customer'} | Driver: ${vehicle?.driverName}`, 14, 30);
      doc.text(`Pending Balance: ${formatCurrency(vehicle?.pendingBalance)}`, 14, 35);

      const tableRows = (ledgerData?.ledger || []).map((row) => [
        formatDate(row.date),
        row.refId || '-',
        row.description,
        row.debit > 0 ? `₹${formatNumber(row.debit)}` : '-',
        row.credit > 0 ? `₹${formatNumber(row.credit)}` : '-',
        `₹${formatNumber(row.balance)}`,
      ]);

      doc.autoTable({
        startY: 42,
        head: [['Date', 'Ref', 'Description', 'Debit', 'Credit', 'Balance']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [88, 28, 135], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { halign: 'right', textColor: [180, 0, 0] },
          4: { halign: 'right', textColor: [0, 130, 0] },
          5: { halign: 'right', fontStyle: 'bold' },
        },
      });

      doc.save(`${vehicle?.vehicleNumber}_Ledger.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      const data = (ledgerData?.ledger || []).map((row) => ({
        Date: formatDate(row.date),
        Ref: row.refId || '-',
        Description: row.description,
        Debit: row.debit || 0,
        Credit: row.credit || 0,
        Balance: row.balance || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vehicle_Ledger');
      XLSX.writeFile(wb, `${vehicle?.vehicleNumber}_Ledger.xlsx`);
      toast.success('Excel exported successfully');
    } catch (err) {
      toast.error('Failed to export Excel');
    }
  };

  if (loading) return <LoadingSpinner text="Loading Vehicle Details..." />;
  if (!vehicle) return <div className="p-6 text-center text-slate-500">Vehicle not found</div>;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/vehicles')}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Vehicles</span>
        </button>
        <StatusBadge status={vehicle.status} />
      </div>

      {/* Vehicle Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="number-plate text-sm">{vehicle.vehicleNumber}</span>
              <StatusBadge status={vehicle.fuelTypes && vehicle.fuelTypes.length > 0 ? vehicle.fuelTypes : vehicle.fuelType} type="fuel" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {vehicle.vehicleName || vehicle.vehicleType}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner:{' '}
              <Link
                to={`/owners/${vehicle.ownerId?._id || vehicle.ownerId}`}
                className="font-bold text-blue-600 hover:underline"
              >
                {vehicle.ownerId?.name || 'Customer'}
              </Link>
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Driver: <span className="font-semibold">{vehicle.driverName}</span> ({vehicle.driverMobile})
            </p>
          </div>
        </div>

        {/* Pending Balance Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-rose-50 border border-purple-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">
              Vehicle Outstanding Balance
            </p>
            <h3 className="text-2xl font-black text-rose-700 font-mono mt-0.5">
              {formatCurrency(vehicle.pendingBalance)}
            </h3>
          </div>
          <div className="text-right text-xs">
            <p className="text-slate-500">Fuel: <span className="font-bold">{formatCurrency(vehicle.totalFuelAmount)}</span></p>
            <p className="text-emerald-700">Paid: <span className="font-bold">{formatCurrency(vehicle.totalPayment)}</span></p>
            <p className="text-slate-500">Liters: <span className="font-bold">{formatLiters(vehicle.totalFuelConsumed)}</span></p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => navigate('/fuel/new')}
            className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Fuel className="w-4 h-4 text-slate-900" />
            <span>Fill Fuel</span>
          </button>
          <button
            onClick={() => navigate('/payments/new')}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Wallet className="w-4 h-4 text-white" />
            <span>Receive Payment</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'ledger' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Vehicle Ledger ({ledgerData?.count || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('fuel')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'fuel' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Fuel className="w-3.5 h-3.5" />
          <span>Fuel History ({fuelHistory.length})</span>
        </button>
      </div>

      {/* Ledger Feed */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Vehicle Ledger Passbook</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportPDF}
                className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {(!ledgerData?.ledger || ledgerData.ledger.length === 0) ? (
            <p className="text-xs text-slate-400 text-center py-6">No ledger entries for this vehicle</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {ledgerData.ledger.map((row) => (
                <div key={row.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800" title={row.description}>{row.description}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(row.date)}</p>
                  </div>
                  <div className="text-right">
                    {row.debit > 0 && <p className="text-xs font-bold text-rose-600">+ {formatCurrency(row.debit)}</p>}
                    {row.credit > 0 && <p className="text-xs font-bold text-emerald-600">- {formatCurrency(row.credit)}</p>}
                    <p className="text-[11px] font-bold text-slate-800 font-mono">Bal: {formatCurrency(row.balance)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fuel History Feed */}
      {activeTab === 'fuel' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Fuel Entries for this vehicle</h3>
          <div className="divide-y divide-slate-100">
            {fuelHistory.map((txn) => (
              <div key={txn._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {txn.fuelType} • {formatLiters(txn.quantity)} @ ₹{txn.pricePerLiter}/L
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(txn.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(txn.totalAmount)}</p>
                  <StatusBadge status={txn.paymentType} type="payment" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetail;
