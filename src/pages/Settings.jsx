import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Truck, Building2, Phone } from 'lucide-react';
import api from '../utils/api';
import { getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { pumpSettings, setPumpSettings } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    pumpName: '',
    pumpAddress: '',
    ownerName: '',
    mobile: '',
    email: '',
    gstNumber: '',
    licenseNumber: '',
  });

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const s = res.data.data;
          setForm({
            pumpName: s.pumpName || '',
            pumpAddress: s.pumpAddress || '',
            ownerName: s.ownerName || '',
            mobile: s.mobile || '',
            email: s.email || '',
            gstNumber: s.gstNumber || '',
            licenseNumber: s.licenseNumber || '',
          });
        }
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pumpName || !form.mobile) {
      toast.error('Pump Name and Mobile are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put('/settings', form);
      if (res.data?.success) {
        toast.success('Petrol Pump details saved successfully');
        setPumpSettings(res.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Settings..." />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <SettingsIcon className="w-4 h-4" />
          </span>
          <span>Petrol Pump Settings</span>
        </h2>
        <p className="text-xs text-slate-500">
          Pump identity shown on receipts, PDF statements, and WhatsApp messages
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Petrol Pump Name *
          </label>
          <input
            type="text"
            value={form.pumpName}
            onChange={(e) => setForm({ ...form, pumpName: e.target.value })}
            placeholder="e.g. Kisan Seva Kendra Indian Oil"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Owner Name
            </label>
            <input
              type="text"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              placeholder="e.g. Surendra Sharma"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pump Mobile Number *
            </label>
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="10-digit mobile"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Pump Full Address
          </label>
          <input
            type="text"
            value={form.pumpAddress}
            onChange={(e) => setForm({ ...form, pumpAddress: e.target.value })}
            placeholder="e.g. NH-27 Highway, Near Toll Plaza, Mohanlalganj"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              GST Number (GSTIN)
            </label>
            <input
              type="text"
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
              placeholder="09AAAAA0000A1Z5"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              License Number (DL/PESO)
            </label>
            <input
              type="text"
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              placeholder="e.g. PESO/EXP/10293"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Email (Optional)
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="pump@example.com"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md mt-3 disabled:opacity-50"
        >
          {submitting ? 'Saving Settings...' : 'Save Pump Profile'}
        </button>
      </form>

      {/* Fleet & Custom Options Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-purple-600" />
          <span>Vehicle Types & Custom Configurations</span>
        </h3>
        <p className="text-xs text-slate-500">
          When registering vehicles, staff can choose standard types or type in custom types under "Other". All added types are saved for the pump.
        </p>
        <div className="pt-2 flex items-center gap-2">
          <a
            href="/vehicles"
            className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold border border-purple-200"
          >
            Manage Vehicle Fleet →
          </a>
          <a
            href="/fuel-prices"
            className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200"
          >
            Add / Edit Fuel Types & Rates →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
