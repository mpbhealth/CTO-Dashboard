import { useState, Suspense } from 'react';
import { 
  useDepartments, 
  useEmployeeProfiles, 
  useDepartmentRelationships,
  useOrgChartPositions 
} from '../../hooks/useOrganizationalData';
import { 
  Building2, 
  Users, 
  GitBranch, 
  Plus, 
  Search, 
  Filter, 
  Save,
  Download,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  FileText, 
  Settings,
  LayoutGrid
} from 'lucide-react';
import InteractiveOrgChart from '../ui/InteractiveOrgChart';
import DepartmentManagement from '../ui/DepartmentManagement';
import EmployeeManagement from '../ui/EmployeeManagement'; 
import PolicyManagement from './PolicyManagement';
import AddDepartmentModal from '../modals/AddDepartmentModal';

export default function OrganizationalStructure() {
  const [activeTab, setActiveTab] = useState('org-chart');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] = useState(false);

  const { data: departments, loading: departmentsLoading, error: departmentsError, refetch: refetchDepartments } = useDepartments();
  const { data: employees, loading: employeesLoading, error: employeesError, refetch: refetchEmployees } = useEmployeeProfiles();
  const { data: relationships, loading: relationshipsLoading } = useDepartmentRelationships();
  const { data: positions, updatePosition, saveLayout, resetLayout } = useOrgChartPositions();

  const loading = departmentsLoading || employeesLoading || relationshipsLoading;
  const error = departmentsError || employeesError;

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
          <p className="text-red-600 mb-4">Error loading organizational data: {error}</p>
          <p className="text-slate-600">Please make sure you're connected to Supabase.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'org-chart', label: 'Org Chart', icon: GitBranch },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'policies', label: 'Policies', icon: FileText },
    { id: 'workflows', label: 'Workflows', icon: Settings }
  ];

  // Calculate organizational metrics
  const totalEmployees = employees.length;
  const totalDepartments = departments.length;
  const activeDepartments = departments.filter(d => d.is_active).length;
  const avgDepartmentSize = totalDepartments > 0 ? Math.round(totalEmployees / totalDepartments) : 0;
  
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };
  
  const handleSaveLayout = async () => {
    try {
      await saveLayout();
      return true;
    } catch (error) {
      console.error('Error saving layout:', error);
      throw error;
    }
  };
  
  const handleResetLayout = async () => {
    try {
      await resetLayout();
      return true; 
    } catch (error) {
      console.error('Error resetting layout:', error);
      throw error;
    }
  };
  
  const handleAddDepartment = () => {
    setIsAddDepartmentModalOpen(true);
  };

  const handleDepartmentDelete = async (departmentId: string) => {
    // First check if this department has any children
    const childDepartments = departments.filter(d => d.parent_department_id === departmentId);
    
    if (childDepartments.length > 0) {
      alert(`Cannot delete this department because it has ${childDepartments.length} child departments. Please reassign or delete the child departments first.`);
      return false;
    }
    
    // Also check if any employees are assigned to this department
    const assignedEmployees = employees.filter(e => e.primary_department_id === departmentId);
    
    if (assignedEmployees.length > 0) {
      alert(`Cannot delete this department because it has ${assignedEmployees.length} employees assigned to it. Please reassign the employees first.`);
      return false;
    }
    
    return true;
  };
  
  const handleAddDepartmentSuccess = () => {
    refetchDepartments();
    setIsAddDepartmentModalOpen(false);
  };

  const handleDepartmentSelect = (departmentId: string) => {
    // setSelectedDepartmentId(departmentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organizational Structure</h1>
          <p className="text-slate-600 mt-2">Manage departments, employees, and organizational workflows</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments, employees..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button> 
          
          <button 
            onClick={handleAddDepartment}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Departments</p>
              <p className="text-2xl font-bold text-slate-900">{activeDepartments}</p>
              <p className="text-xs text-slate-500">of {totalDepartments} total</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Employees</p>
              <p className="text-2xl font-bold text-slate-900">{totalEmployees}</p>
              <p className="text-xs text-slate-500">
                {employees.filter(e => e.employment_status === 'active').length} active
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Dept Size</p>
              <p className="text-2xl font-bold text-slate-900">{avgDepartmentSize}</p>
              <p className="text-xs text-slate-500">employees per dept</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Relationships</p>
              <p className="text-2xl font-bold text-slate-900">{relationships.length}</p>
              <p className="text-xs text-slate-500">dept connections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {activeTab === 'org-chart' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Interactive Organization Chart</h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={toggleEditMode}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isEditMode 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                  {isEditMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  <span>{isEditMode ? 'Finish Editing' : 'Edit Layout'}</span>
                </button>
              </div>
            </div>
            
            <InteractiveOrgChart
              departments={departments}
              employees={employees}
              relationships={relationships}
              positions={positions}
              onPositionUpdate={updatePosition}
              isEditMode={isEditMode}
              onSaveLayout={handleSaveLayout}
              onResetLayout={handleResetLayout}
             onDepartmentSelect={handleDepartmentSelect}
              searchTerm={searchTerm || ''}
            />
          </div>
        )}

        {activeTab === 'departments' && (
          <DepartmentManagement
            departments={departments}
           employees={employees}
            onRefresh={() => refetchDepartments()}
            onDeleteCheck={handleDepartmentDelete}
            searchTerm={searchTerm || ''}
            onAddDepartment={handleAddDepartment}
          />
        )}

        {activeTab === 'employees' && (
          <Suspense fallback={<div className="p-6 text-center">Loading employee management...</div>}>
            <EmployeeManagement
              employees={employees}
              departments={departments}
             onRefresh={() => refetchEmployees()}
              searchTerm={searchTerm}
            />
          </Suspense>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Organizational Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Size Distribution */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">Department Size Distribution</h3>
                <div className="space-y-3">
                  {departments.map((dept) => {
                    const deptEmployees = employees.filter(e => e.primary_department_id === dept.id);
                    const percentage = totalEmployees > 0 ? (deptEmployees.length / totalEmployees) * 100 : 0;
                    
                    return (
                      <div key={dept.id} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">{dept.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-900 w-8">
                            {deptEmployees.length}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reporting Structure */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">Reporting Structure Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Direct Reports:</span>
                    <span className="font-medium">
                      {employees.filter(e => e.reports_to_id !== null).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Managers:</span>
                    <span className="font-medium">
                      {employees.filter(e => 
                        employees.some(emp => emp.reports_to_id === e.id)
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Independent Contributors:</span>
                    <span className="font-medium">
                      {employees.filter(e => 
                        !employees.some(emp => emp.reports_to_id === e.id)
                      ).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <PolicyManagement />
        )}

        {activeTab === 'workflows' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Department Workflows</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                <span>Create Workflow</span>
              </button>
            </div>
            
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No workflows configured.</p>
              <p className="text-sm text-slate-500">Create your first workflow to streamline department processes.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Department Modal */}
      {isAddDepartmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AddDepartmentModal 
            onClose={() => setIsAddDepartmentModalOpen(false)} 
            onSuccess={handleAddDepartmentSuccess} 
            departments={departments} 
            employees={employees} 
          />
        </div>
      )}
    </div>
  );
}