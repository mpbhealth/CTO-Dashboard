import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, ChevronDown, ChevronRight } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  headcount?: number;
  budget_allocated?: number;
  is_active?: boolean;
}

interface Employee {
  id: string;
  name: string;
  position?: string;
  department?: string;
}

interface DepartmentRelationship {
  id: string;
  parent_department_id: string;
  child_department_id: string;
  relationship_type: string;
}

interface OrgChartPosition {
  department_id: string;
  x_position: number;
  y_position: number;
}

interface InteractiveOrgChartProps {
  departments: Department[];
  employees?: Employee[];
  relationships?: DepartmentRelationship[];
  positions?: OrgChartPosition[];
  editMode?: boolean;
  _onPositionUpdate?: (departmentId: string, x: number, y: number) => void;
  onSelectDepartment?: (department: Department) => void;
}

interface DepartmentNode extends Department {
  children: DepartmentNode[];
  employees: Employee[];
  position?: { x: number; y: number };
}

export default function InteractiveOrgChart({
  departments,
  employees = [],
  relationships = [],
  positions = [],
  editMode = false,
  onSelectDepartment,
}: InteractiveOrgChartProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [orgTree, setOrgTree] = useState<DepartmentNode[]>([]);

  useEffect(() => {
    const buildOrgTree = (): DepartmentNode[] => {
      const deptMap = new Map<string, DepartmentNode>();

      departments.forEach(dept => {
        const position = positions.find(p => p.department_id === dept.id);
        deptMap.set(dept.id, {
          ...dept,
          children: [],
          employees: employees.filter(e => e.department === dept.id || e.department === dept.name),
          position: position ? { x: position.x_position, y: position.y_position } : undefined,
        });
      });

      const rootNodes: DepartmentNode[] = [];
      const childIds = new Set(relationships.map(r => r.child_department_id));

      relationships.forEach(rel => {
        const parent = deptMap.get(rel.parent_department_id);
        const child = deptMap.get(rel.child_department_id);
        if (parent && child) {
          parent.children.push(child);
        }
      });

      deptMap.forEach((node, id) => {
        if (!childIds.has(id)) {
          rootNodes.push(node);
        }
      });

      if (rootNodes.length === 0 && deptMap.size > 0) {
        return Array.from(deptMap.values()).slice(0, 10);
      }

      return rootNodes;
    };

    const tree = buildOrgTree();
    setOrgTree(tree);
  }, [departments, employees, relationships, positions]);

  const toggleNode = (departmentId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(departmentId)) {
        next.delete(departmentId);
      } else {
        next.add(departmentId);
      }
      return next;
    });
  };

  const renderNode = (node: DepartmentNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.1 }}
        className={level > 0 ? 'ml-8' : ''}
      >
        <div className="flex items-start space-x-3 mb-4">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="mt-1 p-1 hover:bg-slate-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}

          <div className="flex-1">
            <div
              className="bg-white rounded-lg shadow-md border border-slate-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectDepartment?.(node)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">{node.name}</h3>
                </div>
                {node.is_active !== false && (
                  <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-slate-600">
                {node.headcount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{node.headcount} employees</span>
                  </div>
                )}
                {node.budget_allocated !== undefined && (
                  <div>
                    Budget: ${node.budget_allocated.toLocaleString()}
                  </div>
                )}
              </div>

              {node.employees.length > 0 && isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-600 mb-2">Team Members</p>
                  <div className="space-y-1">
                    {node.employees.slice(0, 5).map(emp => (
                      <div key={emp.id} className="text-xs text-slate-600">
                        {emp.name} {emp.position && `- ${emp.position}`}
                      </div>
                    ))}
                    {node.employees.length > 5 && (
                      <div className="text-xs text-slate-500 italic">
                        +{node.employees.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isExpanded && hasChildren && (
              <div className="mt-2 border-l-2 border-slate-200 pl-4">
                {node.children.map(child => renderNode(child, level + 1))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (departments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Departments Yet</h3>
        <p className="text-slate-600">Add departments to start building your org chart</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Organization Chart</h2>
        <p className="text-sm text-slate-600">
          {editMode ? 'Click departments to edit positions' : 'Click arrows to expand/collapse departments'}
        </p>
      </div>

      <div className="space-y-4">
        {orgTree.map(node => renderNode(node, 0))}
      </div>

      {orgTree.length === 0 && departments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-slate-600 mb-4 text-center">No hierarchical structure defined - showing grid view</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.slice(0, 12).map(dept => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-slate-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => onSelectDepartment?.(dept)}
              >
                <div className="font-medium text-slate-900 mb-2">{dept.name}</div>
                <div className="text-sm text-slate-600 space-y-1">
                  {dept.headcount !== undefined && <div>{dept.headcount} employees</div>}
                  {dept.budget_allocated !== undefined && <div>${dept.budget_allocated.toLocaleString()}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
