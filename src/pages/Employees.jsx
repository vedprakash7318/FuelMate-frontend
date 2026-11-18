import React, { useState, useEffect } from 'react';
import { 
  UserCog, 
  Plus, 
  Pencil, 
  Key, 
  History, 
  ShieldCheck, 
  Phone 
} from 'lucide-react';
import api from '../utils/api';
import { formatDate, formatDateTime, getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    username: '',
    password: '',
    address: '',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset Password Modal
  const [resetEmp, setResetEmp] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Activity Logs Modal
  const [activityEmp, setActivityEmp] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      username: '',
      password: '',
      address: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      mobile: emp.mobile || '',
      email: emp.email || '',
      username: emp.username || '',
      password: '',
      address: emp.address || '',
      status: emp.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || (!editingEmployee && (!formData.username || !formData.password))) {
      toast.error('Please fill required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEmployee) {
        const res = await api.put(`/users/${editingEmployee._id}`, {
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          address: formData.address,
          status: formData.status,
        });
        if (res.data?.success) toast.success('Staff details updated');
      } else {
        const res = await api.post('/users', formData);
        if (res.data?.success) toast.success('Employee created successfully');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResetting(true);
    try {
      const res = await api.patch(`/users/${resetEmp._id}/password`, { newPassword });
      if (res.data?.success) {
        toast.success(`Password reset for ${resetEmp.name}`);
        setResetEmp(null);
        setNewPassword('');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  const handleViewActivity = async (emp) => {
    setActivityEmp(emp);
    setLoadingLogs(true);
    try {
      const res = await api.get(`/users/${emp._id}/activity`);
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/users/${emp._id}`, { status: nextStatus });
      if (res.data?.success) {
        toast.success(`Employee marked ${nextStatus}`);
        fetchEmployees();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner text="Loading Staff Details..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserCog className="w-4 h-4" />
            </span>
            <span>Employee Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            {employees.length} employees • Staff accounts for pump operations
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Employees Cards */}
      <div className="space-y-3">
        {employees.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <UserCog className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700 mt-2">No employees registered</p>
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp._id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-extrabold text-base flex-shrink-0">
                    {emp.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{emp.name}</h4>
                      <StatusBadge status={emp.status} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Username: <span className="font-mono text-blue-600 font-bold">{emp.username}</span> • {emp.mobile}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Joined: {formatDate(emp.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  title="Edit details"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => handleViewActivity(emp)}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Activity Log</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setResetEmp(emp);
                      setNewPassword('');
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 flex items-center gap-1"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Reset Pass</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(emp)}
                    className={`px-2.5 py-1.5 font-bold rounded-lg border ${
                      emp.status === 'active'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Employee Details' : 'Add New Employee'}
        subtitle="Staff member for daily fuel filling & payments"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Employee Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Shyam Verma"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="emp@example.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {!editingEmployee && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  placeholder="e.g. shyam123"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Address / Village"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md mt-2 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Register Employee'}
          </button>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={Boolean(resetEmp)}
        onClose={() => setResetEmp(null)}
        title="Reset Password"
        subtitle={`Set new password for ${resetEmp?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter at least 6 characters"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={resetting}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
          >
            {resetting ? 'Resetting...' : 'Save New Password'}
          </button>
        </form>
      </Modal>

      {/* Activity Logs Modal */}
      <Modal
        isOpen={Boolean(activityEmp)}
        onClose={() => setActivityEmp(null)}
        title="Activity Audit Log"
        subtitle={`Action history of ${activityEmp?.name}`}
        maxWidth="max-w-xl"
      >
        {loadingLogs ? (
          <LoadingSpinner text="Loading activity history..." />
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No activity records logged for this employee</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log._id} className="py-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 font-mono text-[11px]">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{formatDateTime(log.createdAt)}</span>
                </div>
                <p className="text-slate-600 mt-0.5">
                  Entity: <span className="font-semibold">{log.entity}</span>
                </p>
                {log.details && (
                  <pre className="mt-1 p-1.5 bg-slate-50 rounded-lg text-[10px] text-slate-500 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Employees;
