import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDeploymentLogs, useProjects, useRoadmapItems } from '../../hooks/useSupabaseData';
import { GitBranch, CheckCircle, XCircle, Clock, Filter, Plus, Edit, Trash2, Save, X, RefreshCw, Calendar, User, ExternalLink, Play, Pause } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import ExportDropdown from '../ui/ExportDropdown';

type DeploymentLog = Database['public']['Tables']['deployment_logs']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type RoadmapItem = Database['public']['Tables']['roadmap_items']['Row'];

interface DeploymentFormData {
  project: string;
  env: 'Development' | 'Staging' | 'Production';
  status: 'Success' | 'Failed' | 'In Progress';
  log: string;
  timestamp: string;
}

export default function Deployments() {
  const { data: deploymentLogs, loading, error, refetch } = useDeploymentLogs();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: roadmapItems, loading: roadmapLoading } = useRoadmapItems();
  
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEnv, setSelectedEnv] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<DeploymentFormData>({
    project: '',
    env: 'Development',
    status: 'In Progress',
    log: '',
    timestamp: new Date().toISOString().slice(0, 16)
  });

  // Auto-create deployments for completed projects
  useEffect(() => {
    if (projects && roadmapItems && deploymentLogs) {
      autoCreateDeploymentsForCompletedProjects();
    }
  }, [projects, roadmapItems, deploymentLogs]);

  const autoCreateDeploymentsForCompletedProjects = async () => {
    if (!projects || !roadmapItems || !deploymentLogs) return;

    // Find completed roadmap items that have corresponding projects
    const completedRoadmapItems = roadmapItems.filter(item => item.status === 'Complete');
    
    for (const roadmapItem of completedRoadmapItems) {
      // Check if there's a corresponding project
      const correspondingProject = projects.find(project => 
        project.name.toLowerCase().includes(roadmapItem.title.toLowerCase()) ||
        roadmapItem.title.toLowerCase().includes(project.name.toLowerCase())
      );

      if (correspondingProject && correspondingProject.status === 'Live') {
        // Check if deployment already exists
        const existingDeployment = deploymentLogs.find(log => 
          log.project.toLowerCase() === correspondingProject.name.toLowerCase()
        );

        if (!existingDeployment) {
          // Create deployment entry
          try {
            await supabase
              .from('deployment_logs')
              .insert([{
                project: correspondingProject.name,
                env: 'Production',
                status: 'Success',
                log: `Automated deployment entry for completed project: ${correspondingProject.name}. Project moved from roadmap to live status.`,
                timestamp: new Date().toISOString()
              }]);
          } catch (err) {
            console.error('Error creating auto deployment:', err);
          }
        }
      }
    }
  };

  if (loading || projectsLoading || roadmapLoading) {
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

  const projectNames = ['All', ...Array.from(new Set([
    ...deploymentLogs.map(log => log.project),
    ...projects.map(project => project.name)
  ]))];
  const statuses = ['All', 'Success', 'Failed', 'In Progress'];
  const environments = ['All', 'Development', 'Staging', 'Production'];
  
  const filteredLogs = deploymentLogs.filter(log => {
    const matchesProject = selectedProject === 'All' || log.project === selectedProject;
    const matchesStatus = selectedStatus === 'All' || log.status === selectedStatus;
    const matchesEnv = selectedEnv === 'All' || log.env === selectedEnv;
    return matchesProject && matchesStatus && matchesEnv;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'Failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'In Progress':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <GitBranch className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'bg-emerald-100 text-emerald-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getEnvColor = (env: string) => {
    switch (env) {
      case 'Production':
        return 'bg-red-100 text-red-800';
      case 'Staging':
        return 'bg-amber-100 text-amber-800';
      case 'Development':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleAddDeployment = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const { error: insertError } = await supabase
        .from('deployment_logs')
        .insert([{
          project: formData.project,
          env: formData.env,
          status: formData.status,
          log: formData.log,
          timestamp: formData.timestamp
        }]);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        project: '',
        env: 'Development',
        status: 'In Progress',
        log: '',
        timestamp: new Date().toISOString().slice(0, 16)
      });

      refetch();
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDeployment = async () => {
    if (!selectedDeployment) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const { error: updateError } = await supabase
        .from('deployment_logs')
        .update({
          project: formData.project,
          env: formData.env,
          status: formData.status,
          log: formData.log,
          timestamp: formData.timestamp
        })
        .eq('id', selectedDeployment.id);

      if (updateError) throw updateError;

      refetch();
      setIsEditModalOpen(false);
      setSelectedDeployment(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeployment = async (deployment: DeploymentLog) => {
    if (window.confirm(`Are you sure you want to delete this deployment log for "${deployment.project}"? This action cannot be undone.`)) {
      setDeletingId(deployment.id);
      try {
        const { error } = await supabase
          .from('deployment_logs')
          .delete()
          .eq('id', deployment.id);

        if (error) throw error;
        refetch();
      } catch (err) {
        console.error('Error deleting deployment:', err);
        alert('Failed to delete deployment log. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const openEditModal = (deployment: DeploymentLog) => {
    setSelectedDeployment(deployment);
    setFormData({
      project: deployment.project,
      env: deployment.env as 'Development' | 'Staging' | 'Production',
      status: deployment.status as 'Success' | 'Failed' | 'In Progress',
      log: deployment.log,
      timestamp: new Date(deployment.timestamp).toISOString().slice(0, 16)
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setSelectedProject('All');
    setSelectedStatus('All');
    setSelectedEnv('All');
  };

  const getProjectStatus = (projectName: string) => {
    const project = projects.find(p => p.name === projectName);
    return project ? project.status : 'Unknown';
  };

  const getProjectProgress = (projectName: string) => {
    const project = projects.find(p => p.name === projectName);
    return project ? project.progress : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deployment Management</h1>
          <p className="text-slate-600 mt-2">Track deployment history, manage releases, and monitor project deployments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            title="Refresh deployment logs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <ExportDropdown data={{
            title: 'MPB Health Deployment Logs',
            data: deploymentLogs.map(log => ({
              Project: log.project,
              Environment: log.env,
              Status: log.status,
              'Deployment Time': new Date(log.timestamp).toLocaleString(),
              'Log Message': log.log,
              'Created Date': new Date(log.created_at).toLocaleDateString()
            })),
            headers: ['Project', 'Environment', 'Status', 'Deployment Time', 'Log Message'],
            filename: 'MPB_Health_Deployment_Logs'
          }} />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            title="Add new deployment log"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deployment</span>
          </button>
        </div>
      </div>

      {/* Deployment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Successful</p>
              <p className="text-2xl font-bold text-slate-900">
                {deploymentLogs.filter(log => log.status === 'Success').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Failed</p>
              <p className="text-2xl font-bold text-slate-900">
                {deploymentLogs.filter(log => log.status === 'Failed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-slate-900">
                {deploymentLogs.filter(log => log.status === 'In Progress').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Deployments</p>
              <p className="text-2xl font-bold text-slate-900">{deploymentLogs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filters:</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projectNames.map(project => (
                <option key={project} value={project}>
                  {project === 'All' ? 'All Projects' : project}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'All' ? 'All Statuses' : status}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
            >
              {environments.map(env => (
                <option key={env} value={env}>
                  {env === 'All' ? 'All Environments' : env}
                </option>
              ))}
            </select>
            {(selectedProject !== 'All' || selectedStatus !== 'All' || selectedEnv !== 'All') && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deployment Logs */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <motion.div 
            key={log.id} 
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start space-x-4 flex-1">
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-slate-900 text-lg">{log.project}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEnvColor(log.env)}`}>
                      {log.env}
                    </span>
                    {getProjectStatus(log.project) !== 'Unknown' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        Project: {getProjectStatus(log.project)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-600 mb-3 leading-relaxed">{log.log}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    {getProjectProgress(log.project) > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProjectProgress(log.project)}%` }}
                          ></div>
                        </div>
                        <span>{getProjectProgress(log.project)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditModal(log)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit deployment"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDeployment(log)}
                  disabled={deletingId === log.id}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete deployment"
                >
                  {deletingId === log.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <GitBranch className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No deployment logs match the selected filters.</p>
            <button
              onClick={clearFilters}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear all filters to see all deployments
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {isAddModalOpen ? 'Add New Deployment' : 'Edit Deployment'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedDeployment(null);
                  setFormError(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Project *
                  </label>
                  <select
                    name="project"
                    required
                    value={formData.project}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.name}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Environment *
                  </label>
                  <select
                    name="env"
                    required
                    value={formData.env}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Development">Development</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Success">Success</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deployment Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="timestamp"
                    required
                    value={formData.timestamp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deployment Log *
                  </label>
                  <textarea
                    name="log"
                    required
                    rows={4}
                    value={formData.log}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Detailed deployment log, including any issues, changes, or notes..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedDeployment(null);
                    setFormError(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={isAddModalOpen ? handleAddDeployment : handleEditDeployment}
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? (isAddModalOpen ? 'Adding...' : 'Updating...') : (isAddModalOpen ? 'Add Deployment' : 'Update Deployment')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}