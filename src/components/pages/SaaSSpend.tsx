import React, { useState } from 'react';
import { useVendors } from '../../hooks/useSupabaseData';
import { CreditCard, TrendingUp, Calendar, DollarSign, Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import ExportDropdown from '../ui/ExportDropdown';

type Vendor = Database['public']['Tables']['vendors']['Row'];

export default function SaaSSpend() {
  const { data: vendors, loading, error, refetch } = useVendors();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    cost: 0,
    billing_cycle: 'Monthly' as 'Monthly' | 'Yearly',
    renewal_date: '',
    owner: '',
    justification: ''
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading data: {error}</p>
          <p className="text-slate-600">Please make sure you're connected to Supabase.</p>
        </div>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(vendors.map(vendor => vendor.category)))];
  
  const filteredVendors = vendors.filter(vendor => 
    selectedCategory === 'All' || vendor.category === selectedCategory
  );

  const totalMonthlySpend = vendors
    .filter(v => v.billing_cycle === 'Monthly')
    .reduce((sum, v) => sum + v.cost, 0);

  const totalYearlySpend = vendors
    .filter(v => v.billing_cycle === 'Yearly')
    .reduce((sum, v) => sum + v.cost, 0);

  const totalAnnualSpend = totalMonthlySpend * 12 + totalYearlySpend;

  const getRenewalStatus = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    const daysUntilRenewal = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilRenewal < 30) return { status: 'urgent', color: 'bg-red-100 text-red-800' };
    if (daysUntilRenewal < 60) return { status: 'warning', color: 'bg-amber-100 text-amber-800' };
    return { status: 'ok', color: 'bg-emerald-100 text-emerald-800' };
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      category: vendor.category,
      cost: vendor.cost,
      billing_cycle: vendor.billing_cycle,
      renewal_date: vendor.renewal_date,
      owner: vendor.owner,
      justification: vendor.justification
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (window.confirm(`Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`)) {
      setDeletingId(vendor.id);
      try {
        const { error } = await supabase
          .from('vendors')
          .delete()
          .eq('id', vendor.id);

        if (error) throw error;
        refetch();
      } catch (err) {
        console.error('Error deleting vendor:', err);
        alert('Failed to delete vendor. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      category: '',
      cost: 0,
      billing_cycle: 'Monthly',
      renewal_date: '',
      owner: '',
      justification: ''
    });
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('vendors')
        .insert([{
          name: formData.name,
          category: formData.category,
          cost: formData.cost,
          billing_cycle: formData.billing_cycle,
          renewal_date: formData.renewal_date,
          owner: formData.owner,
          justification: formData.justification
        }]);

      if (error) throw error;
      
      resetFormData();
      refetch();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding vendor:', err);
      alert('Failed to add vendor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          name: formData.name,
          category: formData.category,
          cost: formData.cost,
          billing_cycle: formData.billing_cycle,
          renewal_date: formData.renewal_date,
          owner: formData.owner,
          justification: formData.justification,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedVendor.id);

      if (error) throw error;
      
      refetch();
      setIsEditModalOpen(false);
      setSelectedVendor(null);
    } catch (err) {
      console.error('Error updating vendor:', err);
      alert('Failed to update vendor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SaaS Spend Management</h1>
          <p className="text-slate-600 mt-2">Track and optimize software subscriptions and vendor costs</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportDropdown data={{
            title: 'MPB Health SaaS Spend Report',
            data: vendors.map(vendor => ({
              Name: vendor.name,
              Category: vendor.category,
              'Monthly Cost': vendor.billing_cycle === 'Monthly' ? `$${vendor.cost}` : `$${Math.round(vendor.cost / 12)}`,
              'Annual Cost': vendor.billing_cycle === 'Yearly' ? `$${vendor.cost}` : `$${vendor.cost * 12}`,
              'Billing Cycle': vendor.billing_cycle,
              'Renewal Date': new Date(vendor.renewal_date).toLocaleDateString(),
              Owner: vendor.owner,
              Justification: vendor.justification,
              'Created Date': new Date(vendor.created_at).toLocaleDateString()
            })),
            headers: ['Name', 'Category', 'Monthly Cost', 'Annual Cost', 'Billing Cycle', 'Renewal Date', 'Owner'],
            filename: 'MPB_Health_SaaS_Spend_Report'
          }} />
          <button 
            onClick={() => {
              resetFormData();
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            title="Add new vendor"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Spend Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Monthly Spend</p>
              <p className="text-2xl font-bold text-slate-900">${totalMonthlySpend.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Annual Spend</p>
              <p className="text-2xl font-bold text-slate-900">${totalAnnualSpend.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Renewals (30 days)</p>
              <p className="text-2xl font-bold text-slate-900">
                {vendors.filter(v => {
                  const days = Math.ceil((new Date(v.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return days <= 30 && days > 0;
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Vendors</p>
              <p className="text-2xl font-bold text-slate-900">{vendors.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-slate-700">Filter by category:</label>
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Vendor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Cost</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Billing</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Renewal</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Owner</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVendors.map((vendor) => {
                const renewalStatus = getRenewalStatus(vendor.renewal_date);
                return (
                  <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{vendor.name}</p>
                        <p className="text-sm text-slate-600">{vendor.justification}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{vendor.category}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">${vendor.cost}</span>
                      <span className="text-sm text-slate-600">/{vendor.billing_cycle.toLowerCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vendor.billing_cycle === 'Monthly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {vendor.billing_cycle}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-slate-900">{new Date(vendor.renewal_date).toLocaleDateString()}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${renewalStatus.color}`}>
                          {renewalStatus.status === 'urgent' ? 'Urgent' : 
                           renewalStatus.status === 'warning' ? 'Soon' : 'OK'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{vendor.owner}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditVendor(vendor)}
                          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit vendor"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteVendor(vendor)}
                          disabled={deletingId === vendor.id}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete vendor"
                        >
                          {deletingId === vendor.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Vendor Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Edit SaaS Vendor</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedVendor(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateVendor} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cost *
                  </label>
                  <input
                    type="number"
                    name="cost"
                    required
                    value={formData.cost}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Billing Cycle *
                  </label>
                  <select
                    name="billing_cycle"
                    required
                    value={formData.billing_cycle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Renewal Date *
                  </label>
                  <input
                    type="date"
                    name="renewal_date"
                    required
                    value={formData.renewal_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Owner *
                  </label>
                  <input
                    type="text"
                    name="owner"
                    required
                    value={formData.owner}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Justification *
                  </label>
                  <textarea
                    name="justification"
                    required
                    rows={3}
                    value={formData.justification}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedVendor(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Update Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Add New SaaS Vendor</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetFormData();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Supabase, GitHub, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Database, Version Control, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cost *
                  </label>
                  <input
                    type="number"
                    name="cost"
                    required
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 49.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Billing Cycle *
                  </label>
                  <select
                    name="billing_cycle"
                    required
                    value={formData.billing_cycle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Renewal Date *
                  </label>
                  <input
                    type="date"
                    name="renewal_date"
                    required
                    value={formData.renewal_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Owner *
                  </label>
                  <input
                    type="text"
                    name="owner"
                    required
                    value={formData.owner}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Vinnie R. Tannous, DevOps Team, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Justification *
                  </label>
                  <textarea
                    name="justification"
                    required
                    rows={3}
                    value={formData.justification}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Why is this vendor necessary? What value does it provide?"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetFormData();
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Vendor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}