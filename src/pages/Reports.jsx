import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Fuel, 
  Droplets 
} from 'lucide-react';
import api from '../utils/api';
import {
  formatCurrency, formatNumber, formatDate, formatDateTime, formatLiters, getErrorMessage
} from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Reports = () => {
  const { pumpSettings } = useAuth();

  const [reportType, setReportType] = useState('daily'); // 'daily' | 'outstanding' | 'custom'
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fuelType, setFuelType] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (reportType === 'daily') {
        endpoint = `/reports/daily?date=${date}`;
      } else if (reportType === 'outstanding') {
        endpoint = '/reports/outstanding';
      } else if (reportType === 'custom') {
        endpoint = `/reports/custom?startDate=${startDate}&endDate=${endDate}${fuelType ? `&fuelType=${fuelType}` : ''}`;
      }

      const res = await api.get(endpoint);
      if (res.data?.success) {
        setReportData(res.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, date, startDate, endDate, fuelType]);

  // Export PDF
  const handleExportPDF = () => {
    if (!reportData) return;
    try {
      const doc = new jsPDF();
      const pumpName = pumpSettings?.pumpName || 'Petrol Pump Khata Manager';

      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text(pumpName, 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Official Report: ${reportType.toUpperCase()} STATEMENT`, 14, 25);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 30);

      if (reportType === 'outstanding') {
        const rows = (reportData.data || []).map((o) => [
          o.ownerId,
          o.name,
          o.mobile,
          o.companyName || '-',
          String(o.totalVehicles || 0),
          `₹${formatNumber(o.totalOutstanding)}`,
        ]);

        doc.autoTable({
          startY: 38,
          head: [['ID', 'Owner Name', 'Mobile', 'Company', 'Vehicles', 'Outstanding Balance']],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [180, 0, 0] },
          columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } },
        });
      } else {
        const rows = (reportData.fuelTransactions || []).map((f) => [
          formatDate(f.createdAt),
          f.transactionId,
          f.ownerId?.name || '-',
          f.vehicleId?.vehicleNumber || '-',
          f.fuelType,
          `${f.quantity} L`,
          `₹${f.pricePerLiter}`,
          `₹${formatNumber(f.totalAmount)}`,
        ]);

        doc.autoTable({
          startY: 38,
          head: [['Date', 'Slip', 'Owner', 'Vehicle', 'Fuel', 'Qty', 'Rate', 'Amount']],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [30, 58, 138] },
          columnStyles: { 7: { halign: 'right', fontStyle: 'bold' } },
        });
      }

      doc.save(`PetrolPump_${reportType}_Report.pdf`);
      toast.success('PDF report downloaded');
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!reportData) return;
    try {
      let exportRows = [];
      if (reportType === 'outstanding') {
        exportRows = (reportData.data || []).map((o) => ({
          'Owner ID': o.ownerId,
          'Owner Name': o.name,
          Mobile: o.mobile,
          Company: o.companyName || '',
          Vehicles: o.totalVehicles || 0,
          'Total Outstanding (Rs)': o.totalOutstanding || 0,
        }));
      } else {
        exportRows = (reportData.fuelTransactions || []).map((f) => ({
          Date: formatDate(f.createdAt),
          'Slip No': f.transactionId,
          Customer: f.ownerId?.name || '',
          Vehicle: f.vehicleId?.vehicleNumber || '',
          'Fuel Type': f.fuelType,
          'Quantity (L)': f.quantity,
          'Rate (Rs/L)': f.pricePerLiter,
          'Total Amount (Rs)': f.totalAmount,
          'Amount Paid (Rs)': f.amountReceived,
          'Pending (Rs)': f.remainingAmount,
        }));
      }

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `PetrolPump_${reportType}_Report.xlsx`);
      toast.success('Excel downloaded');
    } catch (err) {
      toast.error('Failed to export Excel');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span>Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">Business performance, fuel audit & outstanding summaries</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportPDF}
            className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
        {[
          { id: 'daily', label: 'Daily Report', icon: Calendar },
          { id: 'outstanding', label: 'Outstanding Balance', icon: AlertCircle },
          { id: 'custom', label: 'Date Range', icon: Clock },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                reportType === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        {reportType === 'daily' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        )}

        {reportType === 'custom' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="">All Fuel</option>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>
          </div>
        )}

        {reportType === 'outstanding' && (
          <p className="text-xs text-slate-500">
            Showing all customer owners with pending credit balance, ranked from highest to lowest debt.
          </p>
        )}
      </div>

      {/* KPI Summary Cards */}
      {loading ? (
        <LoadingSpinner text="Generating Report Data..." />
      ) : reportType === 'outstanding' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-600 to-red-800 text-white shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-rose-200">Total Outstanding Khata</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 font-mono">
                {formatCurrency(reportData?.totalOutstanding || 0)}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                {reportData?.count || 0} Debtors
              </span>
            </div>
          </div>

          {/* Debtors List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm divide-y divide-slate-100">
            {(reportData?.data || []).map((o) => (
              <div key={o._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{o.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {o.ownerId} • {o.mobile} • {o.totalVehicles} Vehicles
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-rose-600 font-mono">
                    {formatCurrency(o.totalOutstanding)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-[10px] font-bold text-blue-800 uppercase">Fuel Value</p>
              <p className="text-base font-extrabold text-blue-950 font-mono mt-0.5">
                {formatCurrency(reportData?.summary?.totalFuelAmount || 0)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-800 uppercase">Payments Received</p>
              <p className="text-base font-extrabold text-emerald-950 font-mono mt-0.5">
                {formatCurrency(reportData?.summary?.totalPaymentsReceived || reportData?.summary?.totalPayments || 0)}
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="text-[10px] font-bold text-amber-800 uppercase">Petrol Liters</p>
              <p className="text-base font-extrabold text-amber-950 font-mono mt-0.5">
                {formatLiters(reportData?.summary?.totalPetrolQty || 0)}
              </p>
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl">
              <p className="text-[10px] font-bold text-teal-800 uppercase">Diesel Liters</p>
              <p className="text-base font-extrabold text-teal-950 font-mono mt-0.5">
                {formatLiters(reportData?.summary?.totalDieselQty || 0)}
              </p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">
              Fuel Transactions in this period ({reportData?.fuelTransactions?.length || 0})
            </h4>

            {(!reportData?.fuelTransactions || reportData.fuelTransactions.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-6">No transactions found</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {reportData.fuelTransactions.map((f) => (
                  <div key={f._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="number-plate text-[10px]">{f.vehicleId?.vehicleNumber || 'VEHICLE'}</span>
                        <span className="font-bold text-slate-800">{f.ownerId?.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {f.fuelType} • {formatLiters(f.quantity)} @ ₹{f.pricePerLiter}/L • {formatDateTime(f.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(f.totalAmount)}</p>
                      <StatusBadge status={f.paymentType} type="payment" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
