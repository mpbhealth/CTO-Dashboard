import { useState, useMemo } from 'react';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Mail, 
  Phone, 
  Search, 
  Filter, 
  ChevronDown,
  UserCircle,
  Briefcase,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  MoreVertical,
  Eye,
  ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  primary_department_id?: string;
  title?: string;
  start_date?: string;
  employment_status?: 'active' | 'inactive' | 'on_leave' | 'terminated';
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  location?: string;
  skills?: string[];
}

interface Department {
  id: string;
  name: string;
}

interface EmployeeManagementProps {
  employees: Employee[];
  departments?: Department[];
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
  searchTerm?: string;
}

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  on_leave: 'bg-amber-100 text-amber-700 border-amber-200',
  terminated: 'bg-red-100 text-red-700 border-red-200'
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  terminated: 'Terminated'
};

const typeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  intern: 'Intern'
};

export default function EmployeeManagement({
  employees,
  departments = [],
  onEdit,
  onDelete,
  onAdd,
  searchTerm: externalSearchTerm,
}: EmployeeManagementProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const searchTerm = externalSearchTerm || internalSearchTerm;

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        fullName.includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = selectedDepartment === 'all' || 
        emp.primary_department_id === selectedDepartment;

      const matchesStatus = selectedStatus === 'all' || 
        emp.employment_status === selectedStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchTerm, selectedDepartment, selectedStatus]);

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return 'Unassigned';
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'Unknown';
  };

  const getPerformanceRoute = () => {
    if (location.pathname.startsWith('/ceod')) {
      return '/ceod/operations/performance-evaluation';
    }
    return '/ctod/operations/performance-evaluation';
  };

  const handleViewPerformance = (employeeId: string) => {
    navigate(`${getPerformanceRoute()}?employee=${employeeId}`);
  };

  // Stats
  const stats = useMemo(() => {
    const active = employees.filter(e => e.employment_status === 'active').length;
    const onLeave = employees.filter(e => e.employment_status === 'on_leave').length;
    return { total: employees.length, active, onLeave };
  }, [employees]);

  return (
    <div className="space-y-6 p-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employee Directory</h2>
          <p className="text-slate-500 mt-1">
            {stats.total} employees • {stats.active} active • {stats.onLeave} on leave
          </p>
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={internalSearchTerm}
              onChange={(e) => setInternalSearchTerm(e.target.value)}
              placeholder="Search by name, email, or title..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2.5 border rounded-xl transition-all ${
              showFilters 
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-slate-300 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2.5 text-sm font-medium transition-all ${
                viewMode === 'table' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2.5 text-sm font-medium transition-all ${
                viewMode === 'cards' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Cards
            </button>
          </div>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-4 pt-4 mt-4 border-t border-slate-200">
                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSelectedDepartment('all');
                    setSelectedStatus('all');
                    setInternalSearchTerm('');
                  }}
                  className="self-end px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map((emp) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{emp.title || 'No title'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {getDepartmentName(emp.primary_department_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border ${
                        statusColors[emp.employment_status || 'active']
                      }`}>
                        {statusLabels[emp.employment_status || 'active']}
                      </span>
                      {emp.employment_type && (
                        <span className="ml-2 text-xs text-slate-400">
                          {typeLabels[emp.employment_type]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {emp.email && (
                          <div className="flex items-center text-xs text-slate-600">
                            <Mail className="w-3 h-3 mr-1.5 text-slate-400" />
                            {emp.email}
                          </div>
                        )}
                        {emp.phone && (
                          <div className="flex items-center text-xs text-slate-600">
                            <Phone className="w-3 h-3 mr-1.5 text-slate-400" />
                            {emp.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {emp.start_date
                          ? new Date(emp.start_date).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleViewPerformance(emp.id)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Performance"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        {onEdit && (
                          <button
                            onClick={() => onEdit(emp)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(emp)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="py-16 text-center">
              <UserCircle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No employees found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Employee</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <p className="text-sm text-slate-500">{emp.title || 'No title'}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === emp.id ? null : emp.id)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeDropdown === emp.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10">
                      <button
                        onClick={() => {
                          handleViewPerformance(emp.id);
                          setActiveDropdown(null);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>View Performance</span>
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => {
                            onEdit(emp);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Employee</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            onDelete(emp);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-slate-600">
                  <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                  {getDepartmentName(emp.primary_department_id)}
                </div>
                {emp.email && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                    {emp.email}
                  </div>
                )}
                {emp.location && (
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {emp.location}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border ${
                  statusColors[emp.employment_status || 'active']
                }`}>
                  {statusLabels[emp.employment_status || 'active']}
                </span>
                {emp.skills && emp.skills.length > 0 && (
                  <div className="flex items-center text-xs text-slate-500">
                    <Star className="w-3 h-3 mr-1" />
                    {emp.skills.length} skills
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <UserCircle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No employees found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
