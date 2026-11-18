import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  BookOpen, 
  FileText, 
  FileSpreadsheet, 
  MessageSquare, 
  Users, 
  Truck, 
  User, 
  Calendar 
} from 'lucide-react';
import api from '../utils/api';
import {
  formatCurrency, formatNumber, formatDate, formatDateTime,
  generateWhatsAppLink, getErrorMessage
} from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchableSelect from '../components/common/SearchableSelect';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const KhataLedger = () => {
  const { pumpSettings } = useAuth();

  const [mode, setMode] = useState('owner'); // 'owner' | 'vehicle'
  const [owners, setOwners] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [selectedId, setSelectedId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const [oRes, vRes] = await Promise.all([
          api.get('/owners?all=true'),
          api.get('/vehicles?all=true'),
        ]);
        if (oRes.data?.success) {
          setOwners(oRes.data.data);
          if (oRes.data.data.length > 0) {
            setSelectedId(oRes.data.data[0]._id);
          }
        }
        if (vRes.data?.success) setVehicles(vRes.data.data);
      } catch (err) {
        toast.error('Failed to load accounts');
      }
    };
    fetchEntities();
  }, []);

  // When mode changes, select first item
  useEffect(() => {
    if (mode === 'owner' && owners.length > 0) {
      setSelectedId(owners[0]._id);
    } else if (mode === 'vehicle' && vehicles.length > 0) {
      setSelectedId(vehicles[0]._id);
    }
  }, [mode]);

  // Fetch Ledger when selectedId, startDate or endDate changes
  useEffect(() => {
    if (!selectedId) return;

    const fetchLedger = async () => {
      setLoading(true);
      try {
        const endpoint = mode === 'owner'
          ? `/ledger/owner/${selectedId}`
          : `/ledger/vehicle/${selectedId}`;
        
        let url = endpoint;
        const params = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (params.length > 0) url += `?${params.join('&')}`;

        const res = await api.get(url);
        if (res.data?.success) {
          setLedgerData(res.data);
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [selectedId, mode, startDate, endDate]);

  const ownerOptions = owners.map((o) => ({
    value: o._id,
    label: o.name,
    badge: o.ownerId,
    subtext: `${o.mobile} • Outstanding: ${formatCurrency(o.totalOutstanding)}`,
    searchText: `${o.name} ${o.mobile} ${o.ownerId} ${o.companyName || ''}`,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: v._id,
    label: v.vehicleNumber,
    badge: v.fuelType,
    subtext: `${v.vehicleName || v.vehicleType} • Driver: ${v.driverName} • Pending: ${formatCurrency(v.pendingBalance)}`,
    searchText: `${v.vehicleNumber} ${v.vehicleName || ''} ${v.driverName} ${v.driverMobile}`,
  }));

  const handleExportPDF = () => {
    if (!ledgerData) return;
    try {
      const doc = new jsPDF();
      const pumpName = pumpSettings?.pumpName || 'Petrol Pump Khata Manager';
      const entityName = mode === 'owner' ? ledgerData.owner?.name : ledgerData.vehicle?.vehicleNumber;

      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text(pumpName, 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Khata Statement (${mode === 'owner' ? 'Customer' : 'Vehicle'}): ${entityName}`, 14, 25);
      doc.text(`Total Outstanding: ${formatCurrency(ledgerData.summary?.currentBalance)}`, 14, 30);

      const rows = (ledgerData.ledger || []).map((row) => [
        formatDate(row.date),
        row.refId || '-',
        row.description,
        row.debit > 0 ? `₹${formatNumber(row.debit)}` : '-',
        row.credit > 0 ? `₹${formatNumber(row.credit)}` : '-',
        `₹${formatNumber(row.balance)}`,
      ]);

      doc.autoTable({
        startY: 38,
        head: [['Date', 'Ref / Slip', 'Description', 'Debit', 'Credit', 'Balance']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { halign: 'right', textColor: [180, 0, 0] },
          4: { halign: 'right', textColor: [0, 130, 0] },
          5: { halign: 'right', fontStyle: 'bold' },
        },
      });

      doc.save(`${entityName}_Khata_Ledger.pdf`);
      toast.success('PDF Statement downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportExcel = () => {
    if (!ledgerData) return;
    try {
      const entityName = mode === 'owner' ? ledgerData.owner?.name : ledgerData.vehicle?.vehicleNumber;
      const rows = (ledgerData.ledger || []).map((row) => ({
        Date: formatDate(row.date),
        Reference: row.refId || '-',
        Description: row.description,
        'Debit (Rs)': row.debit || 0,
        'Credit (Rs)': row.credit || 0,
        'Balance (Rs)': row.balance || 0,
        Vehicle: row.vehicleNumber || '-',
        Staff: row.user || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
      XLSX.writeFile(wb, `${entityName}_Ledger.xlsx`);
      toast.success('Excel downloaded');
    } catch (err) {
      toast.error('Failed to export Excel');
    }
  };

  const selectedOwner = owners.find((o) => o._id === selectedId);
  const waLink = mode === 'owner' && selectedOwner
    ? generateWhatsAppLink(
        selectedOwner.mobile,
        selectedOwner.name,
        ledgerData?.summary?.currentBalance ?? selectedOwner.totalOutstanding,
        pumpSettings?.pumpName || 'Petrol Pump'
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </span>
            <span>Khata Passbook / Ledger</span>
          </h2>
          <p className="text-xs text-slate-500">Digital ledger with running balances</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportPDF}
            disabled={!ledgerData?.ledger?.length}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 disabled:opacity-40 flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!ledgerData?.ledger?.length}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 disabled:opacity-40 flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* Select Mode & Searchable Account Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        {/* Toggle Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('owner')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'owner'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Owner Wise Khata</span>
          </button>
          <button
            onClick={() => setMode('vehicle')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'vehicle'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Vehicle Wise Khata</span>
          </button>
        </div>

        {/* Searchable Account Selector */}
        <div>
          {mode === 'owner' ? (
            <SearchableSelect
              label="Select Customer Owner *"
              options={ownerOptions}
              value={selectedId}
              onChange={(val) => setSelectedId(val)}
              placeholder="Search Owner by Name, Mobile, ID..."
              searchPlaceholder="Type customer name, phone or ID..."
              required
              icon={<User className="w-4 h-4 text-slate-400" />}
            />
          ) : (
            <SearchableSelect
              label="Select Vehicle *"
              options={vehicleOptions}
              value={selectedId}
              onChange={(val) => setSelectedId(val)}
              placeholder="Search by Vehicle Number, Driver..."
              searchPlaceholder="Type vehicle number..."
              required
              icon={<Truck className="w-4 h-4 text-slate-400" />}
            />
          )}
        </div>

        {/* Date Filter */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-medium text-slate-500 mb-0.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-500 mb-0.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Banner */}
      {ledgerData?.summary && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-rose-700 uppercase">Total Debit</p>
            <p className="text-sm sm:text-base font-extrabold text-rose-800 font-mono mt-0.5">
              {formatCurrency(ledgerData.summary.totalDebit)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Total Credit</p>
            <p className="text-sm sm:text-base font-extrabold text-emerald-800 font-mono mt-0.5">
              {formatCurrency(ledgerData.summary.totalCredit)}
            </p>
          </div>
          <div className="p-3 bg-slate-900 text-white rounded-2xl text-center">
            <p className="text-[10px] font-bold text-amber-300 uppercase">Net Outstanding</p>
            <p className="text-sm sm:text-base font-extrabold text-amber-400 font-mono mt-0.5">
              {formatCurrency(ledgerData.summary.currentBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Passbook Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        {loading ? (
          <LoadingSpinner text="Calculating running ledger..." />
        ) : !ledgerData?.ledger || ledgerData.ledger.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No ledger entries found for this selection
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <th className="py-2 px-1">Date</th>
                  <th className="py-2 px-2">Description</th>
                  <th className="py-2 px-2 text-right text-rose-700">Debit</th>
                  <th className="py-2 px-2 text-right text-emerald-700">Credit</th>
                  <th className="py-2 px-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerData.ledger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-1 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="font-semibold text-slate-800 text-xs block" title={row.description}>
                        {row.description}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KhataLedger;
