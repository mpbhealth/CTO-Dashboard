import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building, 
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Save,
  FolderKanban,
  Zap
} from 'lucide-react';
import { useAssignments } from '../../hooks/useAssignments';
import { useProjects } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';

interface AssignmentFormData {
  title: string;
  description: string;
  assigned_to: string;
  project_id: string;
  status: 'todo' | 'in_progress' | 'done';
  due_date: string;
}

export default function Assignments() {
  const { data: assignments, loading, error, refetch, addAssignment, updateAssignment, deleteAssignment } = useAssignments();
  const { data: projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAssignee, setSelectedAssignee] = useState('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeTab, setActiveTab] = useState<'assignments' | 'monday'>('assignments');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    assigned_to: '',
    project_id: '',
    status: 'todo',
    due_date: ''
  });

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        setFormData(prev => ({ ...prev, assigned_to: user.id }));
      }
    };
    getCurrentUser();
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
          <p className="text-red-600 mb-4">Error loading assignments: {error}</p>
          <p className="text-slate-600">Please make sure you're connected to Supabase.</p>
        </div>
      </div>
    );
  }

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === '' ||
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = selectedProject === 'All' || assignment.project_id === selectedProject;
    const matchesStatus = selectedStatus === 'All' || assignment.status === selectedStatus;
    const matchesAssignee = selectedAssignee === 'All' || assignment.assigned_to === selectedAssignee;
    
    return matchesSearch && matchesProject && matchesStatus && matchesAssignee;
  });

  // Get unique assignees for filter
  const assignees = ['All', ...Array.from(new Set(assignments.map(a => a.assigned_to).filter(Boolean)))];
  const projectOptions = ['All', ...projects.map(p => ({ id: p.id, name: p.name }))];
  const statuses = ['All', 'todo', 'in_progress', 'done'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Circle className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-emerald-100 text-emerald-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityFromDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'normal';
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'urgent';
    if (daysUntilDue <= 7) return 'soon';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await addAssignment({
        title: formData.title,
        description: formData.description || null,
        assigned_to: formData.assigned_to,
        project_id: formData.project_id || null,
        status: formData.status,
        due_date: formData.due_date || null
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        assigned_to: currentUser?.id || '',
        project_id: '',
        status: 'todo',
        due_date: ''
      });

      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await updateAssignment(selectedAssignment.id, {
        title: formData.title,
        description: formData.description || null,
        assigned_to: formData.assigned_to,
        project_id: formData.project_id || null,
        status: formData.status,
        due_date: formData.due_date || null
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setIsEditModalOpen(false);
      setSelectedAssignment(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignment: any) => {
    if (window.confirm(`Are you sure you want to delete "${assignment.title}"? This action cannot be undone.`)) {
      setDeletingId(assignment.id);
      try {
        const result = await deleteAssignment(assignment.id);
        if (!result.success) {
          throw new Error(result.error);
        }
      } catch (err) {
        console.error('Error deleting assignment:', err);
        alert('Failed to delete assignment. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const openEditModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      assigned_to: assignment.assigned_to || '',
      project_id: assignment.project_id || '',
      status: assignment.status,
      due_date: assignment.due_date || ''
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
    setSelectedAssignee('All');
    setSearchTerm('');
  };

  // Group assignments by status for kanban view
  const groupedAssignments = {
    todo: filteredAssignments.filter(a => a.status === 'todo'),
    in_progress: filteredAssignments.filter(a => a.status === 'in_progress'),
    done: filteredAssignments.filter(a => a.status === 'done')
  };

  const renderKanbanColumn = (status: string, title: string, assignments: any[]) => (
    <div className="bg-slate-50 p-4 rounded-xl min-h-96">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(status)}
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="text-sm text-slate-600">({assignments.length})</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {assignments.map((assignment) => {
          const priority = getPriorityFromDueDate(assignment.due_date);
          const project = projects.find(p => p.id === assignment.project_id);
          
          return (
            <motion.div
              key={assignment.id}
              layout
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(priority)}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-slate-900 text-sm leading-tight">{assignment.title}</h4>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(assignment)}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment)}
                    disabled={deletingId === assignment.id}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    {deletingId === assignment.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {assignment.description && (
                <p className="text-xs text-slate-600 mb-3 line-clamp-2">{assignment.description}</p>
              )}
              
              <div className="space-y-2">
                {project && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Building className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-600">{project.name}</span>
                  </div>
                )}
                
                {assignment.due_date && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-600">
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
        {assignments.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {title.toLowerCase()} assignments</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-600 mt-2">Track and manage task assignments across projects</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Assignments</p>
              <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
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
                {assignments.filter(a => a.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-slate-900">
                {assignments.filter(a => a.status === 'done').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Overdue</p>
              <p className="text-2xl font-bold text-slate-900">
                {assignments.filter(a => {
                  if (!a.due_date) return false;
                  return new Date(a.due_date) < new Date() && a.status !== 'done';
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center border-b border-slate-200">
          <button
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'assignments'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab('assignments')}
          >
            <CheckSquare className="w-4 h-4" />
            <span>My Assignments</span>
          </button>
          <button
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'monday'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab('monday')}
          >
            <Zap className="w-4 h-4" />
            <span>Monday Tasks</span>
          </button>
        </div>

        {activeTab === 'assignments' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="All">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                
                <select
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'All' ? 'All Statuses' : status.replace('_', ' ')}
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      viewMode === 'kanban' ? 'bg-white shadow text-slate-800' : 'text-slate-600'
                    }`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-600'
                    }`}
                  >
                    List
                  </button>
                </div>

                {(selectedProject !== 'All' || selectedStatus !== 'All' || searchTerm) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            {viewMode === 'kanban' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderKanbanColumn('todo', 'To Do', groupedAssignments.todo)}
                {renderKanbanColumn('in_progress', 'In Progress', groupedAssignments.in_progress)}
                {renderKanbanColumn('done', 'Done', groupedAssignments.done)}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => {
                  const priority = getPriorityFromDueDate(assignment.due_date);
                  const project = projects.find(p => p.id === assignment.project_id);
                  
                  return (
                    <motion.div
                      key={assignment.id}
                      layout
                      className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${getPriorityColor(priority)}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {getStatusIcon(assignment.status)}
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{assignment.title}</h4>
                            {assignment.description && (
                              <p className="text-sm text-slate-600 mt-1">{assignment.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              {project && (
                                <div className="flex items-center space-x-1">
                                  <Building className="w-3 h-3" />
                                  <span>{project.name}</span>
                                </div>
                              )}
                              {assignment.due_date && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>Me</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                            {assignment.status.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openEditModal(assignment)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(assignment)}
                              disabled={deletingId === assignment.id}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            >
                              {deletingId === assignment.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredAssignments.length === 0 && (
                  <div className="text-center py-12">
                    <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No assignments match your filters.</p>
                    <button
                      onClick={clearFilters}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Clear filters to see all assignments
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'monday' && (
          <div className="p-6">
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">Monday.com tasks integration</p>
              <p className="text-sm text-slate-500">Monday tasks will be displayed here based on the selected project.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Assignment Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {isAddModalOpen ? 'Add New Assignment' : 'Edit Assignment'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedAssignment(null);
                  setFormError(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddAssignment : handleEditAssignment} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Review API documentation"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Detailed description of the assignment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Project
                  </label>
                  <select
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">No Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
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
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Assigned To *
                  </label>
                  <select
                    name="assigned_to"
                    required
                    value={formData.assigned_to}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Assignee</option>
                    <option value={currentUser?.id || ''}>Me</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedAssignment(null);
                    setFormError(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? (isAddModalOpen ? 'Adding...' : 'Updating...') : (isAddModalOpen ? 'Add Assignment' : 'Update Assignment')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}