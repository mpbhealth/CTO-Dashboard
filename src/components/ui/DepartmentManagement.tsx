import { useState, useMemo } from 'react';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  ChevronDown,
  Building2,
  Users,
  DollarSign,
  MapPin,
  Mail,
  UserCircle,
  ChevronRight,
  MoreVertical,
  Eye,
  GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Department {
  id: string;
  name: string;
  description?: string;
  code?: string;
  headcount?: number;
  budget_allocated?: number;
  is_active?: boolean;
  parent_department_id?: string;
  department_lead_id?: string;
  location?: string;
  contact_email?: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  primary_department_id?: string;
}

interface DepartmentManagementProps {
  departments: Department[];
  employees?: Employee[];
  onEdit?: (department: Department) => void;
  onDelete?: (department: Department) => void;
  onAdd?: () => void;
  onAddDepartment?: () => void;
  onRefresh?: () => void;
  onDeleteCheck?: (department: Department) => void;
  searchTerm?: string;
}

export default function DepartmentManagement({
  departments,
  employees = [],
  onEdit,
  onDelete,
  onAdd,
  onAddDepartment,
  searchTerm: externalSearchTerm,
}: DepartmentManagementProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('table');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const searchTerm = externalSearchTerm || internalSearchTerm;

  // Get employee counts by department
  const employeeCountsByDept = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
      if (emp.primary_department_id) {
        counts[emp.primary_department_id] = (counts[emp.primary_department_id] || 0) + 1;
      }
    });
    return counts;
  }, [employees]);

  // Get department lead info
  const getDepartmentLead = (leadId?: string) => {
    if (!leadId) return null;
    const lead = employees.find(e => e.id === leadId);
    return lead ? `${lead.first_name} ${lead.last_name}` : null;
  };

  // Filter departments
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      const matchesSearch = searchTerm === '' || 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' ? dept.is_active !== false : dept.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  // Build hierarchy
  const hierarchy = useMemo(() => {
    const topLevel = filteredDepartments.filter(d => !d.parent_department_id);
    const getChildren = (parentId: string): Department[] => {
      return filteredDepartments.filter(d => d.parent_department_id === parentId);
    };
    return { topLevel, getChildren };
  }, [filteredDepartments]);

  // Stats
  const stats = useMemo(() => {
    const totalBudget = departments.reduce((sum, d) => sum + (d.budget_allocated || 0), 0);
    const totalHeadcount = departments.reduce((sum, d) => sum + (d.headcount || 0), 0);
    const active = departments.filter(d => d.is_active !== false).length;
    return { total: departments.length, active, totalBudget, totalHeadcount };
  }, [departments]);

  const toggleExpand = (deptId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepartments(newExpanded);
  };

  const handleAddClick = () => {
    if (onAddDepartment) {
      onAddDepartment();
    } else if (onAdd) {
      onAdd();
    }
  };

  // Hierarchy row component
  const HierarchyRow = ({ dept, level = 0 }: { dept: Department; level?: number }) => {
    const children = hierarchy.getChildren(dept.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedDepartments.has(dept.id);
    const employeeCount = employeeCountsByDept[dept.id] || 0;
    const leadName = getDepartmentLead(dept.department_lead_id);

    return (
      <>
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hover:bg-slate-50 transition-colors"
        >
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(dept.id)}
                  className="p-1 mr-2 hover:bg-slate-200 rounded transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              )}
              {!hasChildren && <span className="w-6 mr-2" />}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  dept.is_active !== false 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                    : 'bg-slate-300'
                }`}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{dept.name}</p>
                  {dept.code && <p className="text-xs text-slate-500">Code: {dept.code}</p>}
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center space-x-1 text-sm text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{employeeCount} employees</span>
            </div>
            {leadName && (
              <p className="text-xs text-slate-500 mt-1">Lead: {leadName}</p>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {dept.budget_allocated ? (
              <span className="text-sm font-medium text-slate-900">
                ${dept.budget_allocated.toLocaleString()}
              </span>
            ) : (
              <span className="text-sm text-slate-400">Not set</span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border ${
              dept.is_active !== false
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {dept.is_active !== false ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right">
            <div className="flex items-center justify-end space-x-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(dept)}
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  title="Edit Department"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(dept)}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
        </motion.tr>
        {hasChildren && isExpanded && children.map(child => (
          <HierarchyRow key={child.id} dept={child} level={level + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Department Management</h2>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
            <span>{stats.total} departments</span>
            <span>•</span>
            <span>{stats.active} active</span>
            <span>•</span>
            <span>${stats.totalBudget.toLocaleString()} total budget</span>
          </div>
        </div>

        <button
          onClick={handleAddClick}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Department</span>
        </button>
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
              placeholder="Search departments..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2.5 border rounded-xl transition-all ${
              showFilters 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
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
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-4 py-2.5 text-sm font-medium transition-all flex items-center space-x-1 ${
                viewMode === 'hierarchy' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Hierarchy</span>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setStatusFilter('all');
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {viewMode === 'hierarchy' ? (
                hierarchy.topLevel.map(dept => (
                  <HierarchyRow key={dept.id} dept={dept} />
                ))
              ) : (
                filteredDepartments.map((dept) => {
                  const employeeCount = employeeCountsByDept[dept.id] || 0;
                  const leadName = getDepartmentLead(dept.department_lead_id);
                  
                  return (
                    <motion.tr
                      key={dept.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            dept.is_active !== false 
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                              : 'bg-slate-300'
                          }`}>
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{dept.name}</p>
                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                              {dept.code && <span>Code: {dept.code}</span>}
                              {dept.location && (
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-0.5" />
                                  {dept.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{employeeCount} employees</span>
                        </div>
                        {leadName && (
                          <p className="text-xs text-slate-500 mt-1">Lead: {leadName}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dept.budget_allocated ? (
                          <div>
                            <span className="text-sm font-medium text-slate-900">
                              ${dept.budget_allocated.toLocaleString()}
                            </span>
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1.5">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                style={{ width: `${Math.min((dept.budget_allocated / (stats.totalBudget || 1)) * 100 * 3, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border ${
                          dept.is_active !== false
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {dept.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(dept)}
                              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Edit Department"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(dept)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredDepartments.length === 0 && (
          <div className="py-16 text-center">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No departments found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
            <button
              onClick={handleAddClick}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Department</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
