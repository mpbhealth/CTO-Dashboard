// @ts-nocheck
import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, Clock, FileText, Plus, Edit, Trash2, X, Save } from 'lucide-react';

export default function Compliance() {
  const [complianceVendors, setComplianceVendors] = useState([
    { name: 'Supabase', status: 'Compliant', certs: ['SOC 2', 'HIPAA'], lastAudit: '2024-11-15' },
    { name: 'GitHub Enterprise', status: 'Compliant', certs: ['SOC 2', 'ISO 27001'], lastAudit: '2024-10-20' },
    { name: 'JotForm Enterprise', status: 'Pending', certs: ['GDPR'], lastAudit: '2024-08-05' },
  ]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'Compliant',
    certs: '',
    lastAudit: new Date().toISOString().split('T')[0]
  });

  const auditLogs = [
    { date: '2024-12-15', event: 'HIPAA Risk Assessment Completed', severity: 'info', details: 'No critical findings identified' },
    { date: '2024-12-10', event: 'Data Encryption Audit', severity: 'warning', details: 'Legacy system encryption needs update' },
    { date: '2024-12-05', event: 'Access Control Review', severity: 'success', details: 'All access controls properly configured' },
    { date: '2024-11-28', event: 'Vendor Security Assessment', severity: 'info', details: 'Quarterly vendor security review completed' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Compliant':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'Review':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-red-600" />;
      default:
        return <Shield className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'bg-emerald-100 text-emerald-800';
      case 'Review':
        return 'bg-amber-100 text-amber-800';
      case 'Pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleAddVendor = () => {
    setFormData({
      name: '',
      status: 'Compliant',
      certs: '',
      lastAudit: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };
  
  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      status: vendor.status,
      certs: vendor.certs.join(', '),
      lastAudit: vendor.lastAudit
    });
    setIsEditModalOpen(true);
  };
  
  const handleDeleteVendor = (vendor) => {
    if (window.confirm(`Are you sure you want to delete ${vendor.name}?`)) {
      setComplianceVendors(complianceVendors.filter(v => v.name !== vendor.name));
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmitAdd = (e) => {
    e.preventDefault();
    const newVendor = {
      name: formData.name,
      status: formData.status,
      certs: formData.certs.split(',').map(cert => cert.trim()).filter(cert => cert),
      lastAudit: formData.lastAudit
    };
    
    setComplianceVendors([...complianceVendors, newVendor]);
    setIsAddModalOpen(false);
  };
  
  const handleSubmitEdit = (e) => {
    e.preventDefault();
    const updatedVendors = complianceVendors.map(vendor => 
      vendor.name === selectedVendor.name 
        ? {
            name: formData.name,
            status: formData.status,
            certs: formData.certs.split(',').map(cert => cert.trim()).filter(cert => cert),
            lastAudit: formData.lastAudit
          }
        : vendor
    );
    
    setComplianceVendors(updatedVendors);
    setIsEditModalOpen(false);
    setSelectedVendor(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Security & Compliance</h1>
        <p className="text-slate-600 mt-2">Monitor compliance status, security audits, and data governance</p>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">HIPAA Compliant</p>
              <p className="text-2xl font-bold text-emerald-600">98%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">SOC 2 Status</p>
              <p className="text-2xl font-bold text-blue-600">Active</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Open Issues</p>
              <p className="text-2xl font-bold text-amber-600">3</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Last Audit</p>
              <p className="text-lg font-bold text-slate-900">Dec 15</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Compliance */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Vendor Compliance Status</h2>
            <p className="text-slate-600 mt-1">Track compliance certifications for all third-party vendors</p>
          </div>
          <button
            onClick={handleAddVendor}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Vendor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Certifications</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Last Audit</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {complianceVendors.map((vendor, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(vendor.status)}
                      <span className="font-medium text-slate-900">{vendor.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {vendor.certs.map((cert, certIndex) => (
                        <span key={certIndex} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {new Date(vendor.lastAudit).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditVendor(vendor)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit vendor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(vendor)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete vendor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Recent Audit Activity</h2>
          <p className="text-slate-600 mt-1">Security and compliance audit trail</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {auditLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(log.severity)}`}>
                  {log.severity.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900">{log.event}</h3>
                    <span className="text-sm text-slate-600">{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Add Vendor</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Supabase"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Review">Review</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label htmlFor="certs" className="block text-sm font-medium text-slate-700 mb-1">
                  Certifications
                </label>
                <input
                  type="text"
                  id="certs"
                  name="certs"
                  value={formData.certs}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., SOC 2, HIPAA (comma separated)"
                />
                <p className="text-xs text-slate-500 mt-1">Separate multiple certifications with commas</p>
              </div>

              <div>
                <label htmlFor="lastAudit" className="block text-sm font-medium text-slate-700 mb-1">
                  Last Audit Date *
                </label>
                <input
                  type="date"
                  id="lastAudit"
                  name="lastAudit"
                  required
                  value={formData.lastAudit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vendor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Vendor Modal */}
      {isEditModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Edit Vendor</h2>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedVendor(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-slate-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  id="editName"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="editStatus" className="block text-sm font-medium text-slate-700 mb-1">
                  Status *
                </label>
                <select
                  id="editStatus"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Review">Review</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label htmlFor="editCerts" className="block text-sm font-medium text-slate-700 mb-1">
                  Certifications
                </label>
                <input
                  type="text"
                  id="editCerts"
                  name="certs"
                  value={formData.certs}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., SOC 2, HIPAA (comma separated)"
                />
                <p className="text-xs text-slate-500 mt-1">Separate multiple certifications with commas</p>
              </div>

              <div>
                <label htmlFor="editLastAudit" className="block text-sm font-medium text-slate-700 mb-1">
                  Last Audit Date *
                </label>
                <input
                  type="date"
                  id="editLastAudit"
                  name="lastAudit"
                  required
                  value={formData.lastAudit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
