import React, { useState, useEffect, useRef } from 'react';
import { useTechStack } from '../../hooks/useSupabaseData';
import { Server, Edit, Trash2, Plus, Search } from 'lucide-react';
import AddTechnologyModal from '../modals/AddTechnologyModal';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import ExportDropdown from '../ui/ExportDropdown';

type TechStackItem = Database['public']['Tables']['tech_stack']['Row'];

export default function TechStack() {
  const { data: techStack, loading, error, refetch } = useTechStack();
  const isMounted = useRef(true);
  const [selectedTech, setSelectedTech] = useState<TechStackItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
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

  const categories = ['All', ...Array.from(new Set(techStack.map(item => item.category)))];
  
  const filteredStack = techStack.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800';
      case 'Experimental':
        return 'bg-amber-100 text-amber-800';
      case 'Deprecated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleAddSuccess = () => {
    refetch();
  };

  const handleDeleteTechnology = async (item: TechStackItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      setDeletingId(item.id);
      try {
        const { error } = await supabase
          .from('tech_stack')
          .delete()
          .eq('id', item.id);

        if (error) throw error;
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          // Refresh the data after successful deletion
          refetch();
        }
      } catch (err) {
        // Only update state if component is still mounted
        if (isMounted.current) {
          console.error('Error deleting technology:', err);
          alert('Failed to delete technology. Please try again.');
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted.current) {
          setDeletingId(null);
        }
      }
    }
  };

  const handleEditTechnology = (item: TechStackItem) => {
    // TODO: Implement edit functionality
    alert(`Edit functionality for "${item.name}" will be implemented soon.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Technology Stack</h1>
          <p className="text-slate-600 mt-2">Manage and track all technologies used across MPB Health</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            title="Refresh technology stack"
          >
            <Server className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <ExportDropdown data={{
            title: 'MPB Health Technology Stack',
            data: techStack.map(item => ({
              Technology: item.name,
              Category: item.category,
              Version: item.version,
              Owner: item.owner,
              Status: item.status,
              Notes: item.notes,
              'Created Date': new Date(item.created_at).toLocaleDateString(),
              'Updated Date': new Date(item.updated_at).toLocaleDateString()
            })),
            headers: ['Technology', 'Category', 'Version', 'Owner', 'Status', 'Notes'],
            filename: 'MPB_Health_Technology_Stack'
          }} />
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
            title="Add new technology"
          >
            <Plus className="w-4 h-4" />
            <span>Add Technology</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Technologies</p>
              <p className="text-2xl font-bold text-slate-900">
                {techStack.filter(item => item.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Experimental</p>
              <p className="text-2xl font-bold text-slate-900">
                {techStack.filter(item => item.status === 'Experimental').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Deprecated</p>
              <p className="text-2xl font-bold text-slate-900">
                {techStack.filter(item => item.status === 'Deprecated').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Technologies</p>
              <p className="text-2xl font-bold text-slate-900">{techStack.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search technologies..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Tech Stack Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-slate-900">Technology Inventory</span>
            </div>
            <span className="text-sm text-slate-600">{filteredStack.length} technologies</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Technology</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Version</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Owner</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStack.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedTech(selectedTech?.id === item.id ? null : item)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        selectedTech?.id === item.id ? 'bg-indigo-600' : 'bg-indigo-100 group-hover:bg-indigo-200'
                      }`}>
                        <Server className={`w-5 h-5 ${
                          selectedTech?.id === item.id ? 'text-white' : 'text-indigo-600'
                        }`} />
                      </div>
                      <div>
                        <p className={`font-semibold transition-colors ${
                          selectedTech?.id === item.id ? 'text-indigo-600' : 'text-slate-900'
                        }`}>{item.name}</p>
                        <p className="text-sm text-slate-600">{item.notes}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{item.version}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{item.owner}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTechnology(item);
                        }}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit technology"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTechnology(item);
                        }}
                        disabled={deletingId === item.id}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete technology"
                      >
                        {deletingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Technology Details Panel */}
        {selectedTech && (
          <div className="border-t border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{selectedTech.name} Details</h3>
              <button
                onClick={() => setSelectedTech(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <Plus className="w-4 h-4 transform rotate-45" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Basic Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-slate-900">{selectedTech.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Version:</span>
                    <span className="text-slate-900 font-mono">{selectedTech.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner:</span>
                    <span className="text-slate-900">{selectedTech.owner}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Status</h4>
                <div className="space-y-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTech.status)}`}>
                    {selectedTech.status}
                  </span>
                  <p className="text-sm text-slate-600">
                    Last updated: {new Date(selectedTech.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleEditTechnology(selectedTech)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit Technology
                  </button>
                  <button
                    onClick={() => alert(`Viewing usage analytics for ${selectedTech.name}`)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Usage
                  </button>
                </div>
              </div>
            </div>
            {selectedTech.notes && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-2">Notes</h4>
                <p className="text-sm text-slate-600 bg-white p-3 rounded border">{selectedTech.notes}</p>
              </div>
            )}
          </div>
        )}
        {filteredStack.length === 0 && (
          <div className="text-center py-12">
            <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No technologies match your search criteria.</p>
          </div>
        )}
      </div>

      {/* Add Technology Modal */}
      <AddTechnologyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}