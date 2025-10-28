import { motion } from 'framer-motion';
import { Building2, Users, TrendingUp } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  headcount?: number;
  budget_allocated?: number;
}

interface InteractiveOrgChartProps {
  departments: Department[];
  onSelectDepartment?: (department: Department) => void;
}

export default function InteractiveOrgChart({
  departments,
  onSelectDepartment,
}: InteractiveOrgChartProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((dept) => (
        <motion.div
          key={dept.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg p-6 shadow-md border border-slate-200 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onSelectDepartment?.(dept)}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{dept.name}</h3>
          </div>

          <div className="space-y-2">
            {dept.headcount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Headcount
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {dept.headcount}
                </span>
              </div>
            )}

            {dept.budget_allocated !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Budget
                </span>
                <span className="text-sm font-medium text-slate-900">
                  ${dept.budget_allocated.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
