import React, { useState } from 'react';
import { X, FileText, Save, Eye, Calendar, Upload, Share2, AlertCircle, Check, Paperclip, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Department } from '../../hooks/useOrganizationalData';

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: Department[];
}

export default function AddPolicyModal({ isOpen, onClose, onSuccess, departments }: AddPolicyModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    document_number: '',
    document_type: 'policy',
    content: '',
    department_id: '',
    version: '1.0',
    status: 'draft',
    effective_date: '',
    review_date: '',
    key_requirements: '',
    affected_roles: '',
    compliance_measures: '', 
    tags: '',
    message: '',
    share_emails: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  const policyCategories = [
    { value: 'policy', label: 'HR Policy' },
    { value: 'sop', label: 'Operations' },
    { value: 'procedure', label: 'Safety' },
    { value: 'guideline', label: 'Compliance' },
    { value: 'handbook', label: 'Other' }
  ];

  const reviewCycles = [
    { value: 'annual', label: 'Annual' },
    { value: 'biannual', label: 'Bi-annual' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'adhoc', label: 'As Needed' }
  ];

  // Dummy data for approvers - in production this would come from a database query
  const approvers = [
    { id: '1', name: 'Vinnie R. Tannous (CTO)', email: 'vinnie@mpbhealth.com' },
    { id: '2', name: 'Sarah Johnson (Compliance)', email: 'sarah@mpbhealth.com' },
    { id: '3', name: 'Michael Chen (Legal)', email: 'michael@mpbhealth.com' },
    { id: '4', name: 'Emily Rodriguez (HR)', email: 'emily@mpbhealth.com' }
  ];

  const handleSubmit = async (e: React.FormEvent, isDraft = true) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Format the content to include key requirements, affected roles, and compliance measures
      const formattedContent = `
## Description
${formData.content}

## Key Requirements
${formData.key_requirements}

## Affected Departments/Roles
${formData.affected_roles}

## Compliance Measures
${formData.compliance_measures}
      `.trim();

      const { error: insertError } = await supabase
        .from('policy_documents')
        .insert([{
          title: formData.title,
          document_type: formData.document_type,
          content: formattedContent,
          department_id: formData.department_id || null,
          version: formData.version,
          status: isDraft ? 'draft' : 'review',
          review_date: formData.review_date || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
        }]);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        title: '',
        document_number: '',
        document_type: 'policy',
        content: '',
        department_id: '',
        version: '1.0',
        status: 'draft',
        effective_date: '',
        review_date: '',
        key_requirements: '',
        affected_roles: '',
        compliance_measures: '',
        tags: '',
        message: '',
        share_emails: ''
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null);
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const validTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const invalidFile = selectedFiles.find(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return !validTypes.includes(ext);
    });
    
    if (invalidFile) {
      setFileUploadError(`Invalid file type: ${invalidFile.name}. Please upload PDF, DOC, DOCX, XLS, or XLSX files only.`);
      return;
    }
    
    // Validate file size (10MB max)
    const oversizedFile = selectedFiles.find(file => file.size > 10 * 1024 * 1024);
    if (oversizedFile) {
      setFileUploadError(`File too large: ${oversizedFile.name}. Maximum file size is 10MB.`);
      return;
    }
    
    // Add new files to the list
    setFiles(prev => [...prev, ...selectedFiles]);
    
    // Initialize progress for each file
    const newProgress = {...uploadProgress};
    selectedFiles.forEach(file => {
      newProgress[file.name] = 0;
    });
    setUploadProgress(newProgress);
    
    // Simulate upload progress
    selectedFiles.forEach(file => {
      simulateFileUpload(file.name);
    });
  };
  
  const simulateFileUpload = (fileName: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(prev => ({...prev, [fileName]: progress}));
    }, 300);
  };
  
  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
    setUploadProgress(prev => {
      const newProgress = {...prev};
      delete newProgress[fileName];
      return newProgress;
    });
  };
  
  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedEmployees(selected);
  };
  
  const handleShare = async () => {
    setIsSharing(true);
    setShareSuccess(false);
    
    // Simulate API call to share policy
    setTimeout(() => {
      setIsSharing(false);
      setShareSuccess(true);
      
      // Reset share form after 3 seconds
      setTimeout(() => {
        setShareSuccess(false);
        setSelectedEmployees([]);
        setFormData(prev => ({...prev, share_emails: '', message: ''}));
      }, 3000);
    }, 2000);
  };

  const togglePreview = () => {
    setIsPreviewing(!isPreviewing);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isPreviewing ? 'Preview Policy' : 'Add New Policy Document'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPreviewing ? (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl">
              <h1 className="text-2xl font-bold text-slate-900 mb-4">{formData.title}</h1>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {policyCategories.find(cat => cat.value === formData.document_type)?.label || formData.document_type}
                </div>
                <div className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm font-medium">
                  Version {formData.version}
                </div>
                <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                  Status: {formData.status}
                </div>
                {formData.department_id && (
                  <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    {departments.find(d => d.id === formData.department_id)?.name || 'Department'}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                {formData.effective_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">Effective Date: {formData.effective_date}</span>
                  </div>
                )}
                {formData.review_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">Review Date: {formData.review_date}</span>
                  </div>
                )}
              </div>
              
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Description</h2>
                <div className="mb-6 text-slate-700 whitespace-pre-wrap">{formData.content}</div>
                
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Key Requirements</h2>
                <div className="mb-6 text-slate-700 whitespace-pre-wrap">{formData.key_requirements}</div>
                
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Affected Departments/Roles</h2>
                <div className="mb-6 text-slate-700 whitespace-pre-wrap">{formData.affected_roles}</div>
                
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Compliance Measures</h2>
                <div className="mb-6 text-slate-700 whitespace-pre-wrap">{formData.compliance_measures}</div>
              </div>
              
              {formData.tags && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.split(',').map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md text-xs">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                onClick={togglePreview}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Back to Edit
              </button>
              <button
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Submit for Review
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, true)} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                      Policy/SOP Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Remote Work Policy"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="document_number" className="block text-sm font-medium text-slate-700 mb-1">
                      Document Number *
                    </label>
                    <input
                      type="text"
                      id="document_number"
                      name="document_number"
                      required
                      value={formData.document_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., POL-HR-001"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="version" className="block text-sm font-medium text-slate-700 mb-1">
                      Version Number *
                    </label>
                    <input
                      type="text"
                      id="version"
                      name="version"
                      required
                      value={formData.version}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 1.0"
                    />
                  </div>

                  <div>
                    <label htmlFor="document_type" className="block text-sm font-medium text-slate-700 mb-1">
                      Policy Category *
                    </label>
                    <select
                      id="document_type"
                      name="document_type" 
                      required
                      value={formData.document_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {policyCategories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="department_id" className="block text-sm font-medium text-slate-700 mb-1">
                      Primary Department
                    </label>
                    <select
                      id="department_id"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="effective_date" className="block text-sm font-medium text-slate-700 mb-1">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      id="effective_date"
                      name="effective_date"
                      value={formData.effective_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="review_date" className="block text-sm font-medium text-slate-700 mb-1">
                      Next Review Date
                    </label>
                    <input
                      type="date"
                      id="review_date"
                      name="review_date"
                      value={formData.review_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="review_cycle" className="block text-sm font-medium text-slate-700 mb-1">
                      Review Cycle
                    </label>
                    <select
                      id="review_cycle"
                      name="review_cycle"
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Review Cycle</option>
                      {reviewCycles.map(cycle => (
                        <option key={cycle.value} value={cycle.value}>{cycle.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Policy Details */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Policy Details</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                      Policy Description *
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      rows={5}
                      required
                      value={formData.content}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Provide a comprehensive description of the policy..."
                    />
                  </div>

                  <div>
                    <label htmlFor="key_requirements" className="block text-sm font-medium text-slate-700 mb-1">
                      Key Requirements *
                    </label>
                    <textarea
                      id="key_requirements"
                      name="key_requirements"
                      rows={3}
                      required
                      value={formData.key_requirements}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Bullet point list of key requirements and rules..."
                    />
                    <p className="text-xs text-slate-500 mt-1">Enter each point on a new line</p>
                  </div>

                  <div>
                    <label htmlFor="affected_roles" className="block text-sm font-medium text-slate-700 mb-1">
                      Affected Departments/Roles *
                    </label>
                    <textarea
                      id="affected_roles"
                      name="affected_roles"
                      rows={3}
                      required
                      value={formData.affected_roles}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="List the departments and roles this policy affects..."
                    />
                  </div>

                  <div>
                    <label htmlFor="compliance_measures" className="block text-sm font-medium text-slate-700 mb-1">
                      Compliance Measures *
                    </label>
                    <textarea
                      id="compliance_measures"
                      name="compliance_measures"
                      rows={3}
                      required
                      value={formData.compliance_measures}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe how compliance with this policy will be measured and enforced..."
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter tags separated by commas (e.g., HR, Security, Onboarding)"
                    />
                    <p className="text-xs text-slate-500 mt-1">Separate multiple tags with commas</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* File Upload Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Attachments</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Upload Documents
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 mb-1">
                      Drag & drop files here or click to browse
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      Accepted formats: PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
                    </p>
                    <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
                      <span>Select Files</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {fileUploadError && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{fileUploadError}</span>
                    </div>
                  )}
                </div>
                
                {/* File List with Upload Progress */}
                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className="text-sm font-medium text-slate-700">Uploaded Files</h4>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-lg flex items-center">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <Paperclip className="w-4 h-4 text-slate-500" />
                              <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                            </div>
                            <div className="mt-1">
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600 rounded-full"
                                  style={{ width: `${uploadProgress[file.name] || 0}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {uploadProgress[file.name] === 100 
                                  ? 'Upload complete' 
                                  : `Uploading ${uploadProgress[file.name]}%`}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFile(file.name)}
                            className="ml-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Approvers Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Approval & Sharing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Required Approver(s)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    multiple
                  >
                    {approvers.map(approver => (
                      <option key={approver.id} value={approver.id}>
                        {approver.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple approvers</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Share With
                  </label>
                  <select
                    multiple
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    onChange={handleEmployeeSelect}
                    value={selectedEmployees}
                  >
                    {departments.map(dept => (
                      <optgroup key={dept.id} label={dept.name}>
                        {/* In a real implementation, you'd fetch and display employees by department */}
                        <option value={`${dept.id}-all`}>All {dept.name} Employees</option>
                      </optgroup>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="share_emails" className="block text-sm font-medium text-slate-700 mb-1">
                    Additional Email Addresses
                  </label>
                  <input
                    type="text"
                    id="share_emails"
                    name="share_emails"
                    value={formData.share_emails}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter email addresses separated by commas"
                  />
                  <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas</p>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                    Share Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={2}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add an optional message to include when sharing this policy..."
                  />
                </div>
                
                {/* Share Button */}
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isSharing || selectedEmployees.length === 0 && !formData.share_emails}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      shareSuccess
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {shareSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Shared Successfully</span>
                      </>
                    ) : isSharing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sharing...</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Share Policy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={togglePreview}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save as Draft'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}