import React, { useState } from 'react';
import { Plus, FileCheck, Calendar, AlertCircle } from 'lucide-react';
import { useBAAs, useCreateBAA } from '../../hooks/useComplianceData';
import { BAAStatusChip } from '../compliance/ComplianceChips';
import type { BAAFormData } from '../../types/compliance';

const ComplianceBAAs: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: baas = [], isLoading } = useBAAs();
  const createBAA = useCreateBAA();

  const [newBAA, setNewBAA] = useState<BAAFormData>({
    vendor: '',
    services_provided: '',
    effective_date: '',
    renewal_date: '',
    auto_renews: false,
    contact_email: '',
    contact_phone: '',
    vendor_contact_name: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBAA.mutateAsync(newBAA);
      setShowCreateModal(false);
      setNewBAA({
        vendor: '',
        services_provided: '',
        effective_date: '',
        renewal_date: '',
        auto_renews: false,
        contact_email: '',
        contact_phone: '',
        vendor_contact_name: '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to create BAA:', error);
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const now = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const expiringSoon = baas.filter(baa => {
    const daysUntil = getDaysUntilRenewal(baa.renewal_date);
    return daysUntil >= 0 && daysUntil <= 60;
  });

  const expired = baas.filter(baa => getDaysUntilRenewal(baa.renewal_date) < 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileCheck className="w-8 h-8 text-indigo-600" />
            <span>Business Associate Agreements</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage BAAs with vendors who handle PHI
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add BAA</span>
        </button>
      </div>

      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">
              {expiringSoon.length} BAA{expiringSoon.length > 1 ? 's' : ''} expiring within 60 days
            </h3>
            <ul className="mt-2 space-y-1">
              {expiringSoon.slice(0, 3).map(baa => (
                <li key={baa.id} className="text-sm text-yellow-800">
                  • {baa.vendor} - {new Date(baa.renewal_date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {expired.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">
              {expired.length} expired BAA{expired.length > 1 ? 's' : ''} require attention
            </h3>
            <ul className="mt-2 space-y-1">
              {expired.map(baa => (
                <li key={baa.id} className="text-sm text-red-800">
                  • {baa.vendor} - expired {new Date(baa.renewal_date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total BAAs</p>
          <p className="text-2xl font-bold text-gray-900">{baas.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-800">
            {baas.filter(b => b.status === 'active').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
          <p className="text-sm text-gray-600">Expiring Soon</p>
          <p className="text-2xl font-bold text-yellow-800">{expiringSoon.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-red-800">{expired.length}</p>
        </div>
      </div>

      {/* BAAs Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Renewal Timeline</span>
        </h2>
        <div className="space-y-3">
          {[...baas]
            .sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime())
            .slice(0, 10)
            .map(baa => {
              const daysUntil = getDaysUntilRenewal(baa.renewal_date);
              const isExpired = daysUntil < 0;
              const isExpiringSoon = daysUntil >= 0 && daysUntil <= 60;

              return (
                <div
                  key={baa.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isExpired
                      ? 'bg-red-50 border border-red-200'
                      : isExpiringSoon
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{baa.vendor}</h4>
                    <p className="text-sm text-gray-600">{baa.services_provided}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(baa.renewal_date).toLocaleDateString()}
                    </p>
                    <p className={`text-xs ${
                      isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {isExpired ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* BAAs Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Effective Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Renewal Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {baas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No BAAs found
                  </td>
                </tr>
              ) : (
                baas.map((baa) => (
                  <tr key={baa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{baa.vendor}</p>
                        {baa.vendor_contact_name && (
                          <p className="text-sm text-gray-500">{baa.vendor_contact_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{baa.services_provided}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {baa.contact_email && <div>{baa.contact_email}</div>}
                      {baa.contact_phone && <div>{baa.contact_phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <BAAStatusChip status={baa.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(baa.effective_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(baa.renewal_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create BAA Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Business Associate Agreement</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBAA.vendor}
                  onChange={(e) => setNewBAA({ ...newBAA, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Acme Cloud Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Services Provided
                </label>
                <textarea
                  value={newBAA.services_provided}
                  onChange={(e) => setNewBAA({ ...newBAA, services_provided: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Description of services"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={newBAA.vendor_contact_name}
                    onChange={(e) => setNewBAA({ ...newBAA, vendor_contact_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={newBAA.contact_email}
                    onChange={(e) => setNewBAA({ ...newBAA, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBAA.effective_date}
                    onChange={(e) => setNewBAA({ ...newBAA, effective_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Renewal Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBAA.renewal_date}
                    onChange={(e) => setNewBAA({ ...newBAA, renewal_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_renews"
                  checked={newBAA.auto_renews}
                  onChange={(e) => setNewBAA({ ...newBAA, auto_renews: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-blue-500"
                />
                <label htmlFor="auto_renews" className="text-sm font-medium text-gray-700">
                  Auto-renews
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newBAA.notes}
                  onChange={(e) => setNewBAA({ ...newBAA, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBAA.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
                >
                  {createBAA.isPending ? 'Adding...' : 'Add BAA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceBAAs;

