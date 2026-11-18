import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, X, Pencil, Truck, MessageSquare, Phone } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatNumber, generateWhatsAppLink, getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Owners = () => {
  const navigate = useNavigate();
  const { pumpSettings } = useAuth();

  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'active' | 'inactive'

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    companyName: '',
    gstNumber: '',
    remark: '',
    status: 'active',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchOwners = async () => {
    try {
      const res = await api.get('/owners');
      if (res.data?.success) {
        setOwners(res.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleOpenAdd = () => {
    setEditingOwner(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e, owner) => {
    e.stopPropagation();
    setEditingOwner(owner);
    setFormData({
      name: owner.name || '',
      mobile: owner.mobile || '',
      alternateMobile: owner.alternateMobile || '',
      email: owner.email || '',
      address: owner.address || '',
      city: owner.city || '',
      state: owner.state || '',
      pinCode: owner.pinCode || '',
      companyName: owner.companyName || '',
      gstNumber: owner.gstNumber || '',
      remark: owner.remark || '',
      status: owner.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSaveOwner = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      toast.error('Owner Name and Mobile Number are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingOwner) {
        const res = await api.put(`/owners/${editingOwner._id}`, formData);
        if (res.data?.success) {
          toast.success('Owner updated successfully');
        }
      } else {
        const res = await api.post('/owners', formData);
        if (res.data?.success) {
          toast.success(res.data.warning || 'New customer registered successfully');
        }
      }
      setIsModalOpen(false);
      fetchOwners();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter owners
  const filteredOwners = owners.filter((o) => {
    const s = search.toLowerCase();
    const matchesSearch =
      o.name?.toLowerCase().includes(s) ||
      o.mobile?.includes(s) ||
      o.companyName?.toLowerCase().includes(s) ||
      o.ownerId?.toLowerCase().includes(s);

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return o.totalOutstanding > 0;
    if (filterTab === 'active') return o.status === 'active';
    if (filterTab === 'inactive') return o.status === 'inactive';
    return true;
  });

  const totalOutstandingSum = filteredOwners.reduce((acc, curr) => acc + (curr.totalOutstanding || 0), 0);

  if (loading) return <LoadingSpinner text="Loading Customer Khata..." />;

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </span>
            <span>Customer Owners</span>
          </h2>
          <p className="text-xs text-slate-500">
            {owners.length} registered customers • Total Pending: {formatCurrency(totalOutstandingSum)}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Owner</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Name, Mobile, Company, ID..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: `All (${owners.length})` },
          { id: 'pending', label: `Outstanding (${owners.filter((o) => o.totalOutstanding > 0).length})` },
          { id: 'active', label: `Active (${owners.filter((o) => o.status === 'active').length})` },
          { id: 'inactive', label: `Inactive (${owners.filter((o) => o.status === 'inactive').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Owners Cards List */}
      <div className="space-y-2.5">
        {filteredOwners.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 mt-2">No customers found</h3>
            <p className="text-xs text-slate-400 mt-1">Try another search or register a new owner</p>
          </div>
        ) : (
          filteredOwners.map((owner) => {
            const waLink = generateWhatsAppLink(
              owner.mobile,
              owner.name,
              owner.totalOutstanding,
              pumpSettings?.pumpName || 'Petrol Pump'
            );

            return (
              <div
                key={owner._id}
                onClick={() => navigate(`/owners/${owner._id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer tap-active relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-base shadow-xs flex-shrink-0">
                      {owner.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {owner.name}
                        </h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                          {owner.ownerId}
                        </span>
                        <StatusBadge status={owner.status} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {owner.companyName ? `${owner.companyName} • ` : ''}
                        <span>{owner.mobile}</span>
                      </p>
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={(e) => handleOpenEdit(e, owner)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Edit Customer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Row Stats & Quick Actions */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg font-semibold border border-slate-100 flex items-center gap-1.5">
                      <Truck className="w-3 h-3 text-slate-500" />
                      <span>{owner.totalVehicles || 0} Vehicles</span>
                    </span>
                    <span className="text-slate-400 hidden sm:inline">
                      Paid: {formatCurrency(owner.totalPayment)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Outstanding Balance</p>
                      <p className={`text-sm font-extrabold font-mono ${
                        owner.totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {formatCurrency(owner.totalOutstanding)}
                      </p>
                    </div>

                    {/* WhatsApp Action */}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm hover:bg-emerald-100 transition-colors"
                        title="WhatsApp Reminder"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                      </a>
                    )}
                    {/* Call Action */}
                    {owner.mobile && (
                      <a
                        href={`tel:${owner.mobile}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm hover:bg-blue-100 transition-colors"
                        title="Call"
                      >
                        <Phone className="w-4 h-4 text-blue-600" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Owner Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOwner ? 'Edit Customer Owner' : 'Register New Customer Owner'}
        subtitle="Customer khata account for petrol pump"
      >
        <form onSubmit={handleSaveOwner} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Owner Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alternate Mobile (Optional)
              </label>
              <input
                type="tel"
                value={formData.alternateMobile}
                onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                placeholder="Alternative contact"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company / Firm (Optional)</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Patel Travels"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="GST Number"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address (Optional)</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full Street / Village Address"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City (Optional)</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State (Optional)</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIN (Optional)</label>
              <input
                type="text"
                value={formData.pinCode}
                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                placeholder="PIN Code"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Remark / Notes (Optional)</label>
            <input
              type="text"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="e.g. Monthly payment on 1st"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md mt-2 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : editingOwner ? 'Update Customer Details' : 'Register Customer'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Owners;
