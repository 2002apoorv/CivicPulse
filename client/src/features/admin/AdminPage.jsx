import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  CheckCircle, 
  XCircle,
  FileText
} from 'lucide-react';
import api from '../../api/client';
import { LoadingSpinner, Modal } from '../../components/common/LoadingSpinner';

export const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('officer');
  const [departmentId, setDepartmentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/departments')
      ]);
      setUsers(uRes.data);
      setDepartments(dRes.data);
    } catch (err) {
      console.error("Fetch users failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/users', {
        email,
        password,
        full_name: fullName,
        role,
        department_id: departmentId ? parseInt(departmentId) : null,
        phone_number: phoneNumber
      });
      setIsCreateModalOpen(false);
      setEmail('');
      setPassword('');
      setFullName('');
      setPhoneNumber('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to provision user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await api.patch(`/admin/users/${userId}`, {
        is_active: !currentActive
      });
      fetchData();
    } catch (err) {
      alert("Failed to update user active status");
    }
  };

  if (loading) return <LoadingSpinner text="Loading user access rosters..." size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Municipal Officer Roster & Access Management</h2>
          <p className="text-xs text-slate-500">Provision official civic officer accounts and configure department routing</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Provision Official User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const dept = departments.find(d => d.id === u.department_id);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                        u.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        u.role === 'officer' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{dept?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        u.is_active ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:underline"
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision Official Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Verma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
            <input
              type="email"
              required
              placeholder="e.g. officer.verma@civicpulse.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="officer">Civic Officer</option>
                <option value="admin">Administrator</option>
                <option value="citizen">Citizen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="">None / General</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
            >
              {submitting ? "Provisioning..." : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
