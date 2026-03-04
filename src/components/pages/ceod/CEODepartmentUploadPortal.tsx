import { Headphones, MessageSquare, ShoppingCart, Activity, DollarSign, ArrowRight, Upload, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DepartmentCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  bgColor: string;
  borderColor: string;
  route: string;
}

const DEPARTMENTS: DepartmentCard[] = [
  {
    id: 'concierge',
    name: 'Concierge Portal',
    description: 'Upload member interactions and support touchpoints',
    icon: MessageSquare,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200 hover:border-teal-400',
    route: '/ceod/upload',
  },
  {
    id: 'sales',
    name: 'Sales Portal',
    description: 'Upload sales orders and pipeline data',
    icon: ShoppingCart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200 hover:border-pink-400',
    route: '/ceod/upload',
  },
  {
    id: 'operations',
    name: 'Operations Portal',
    description: 'Upload cancellation and churn metrics',
    icon: Activity,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200 hover:border-orange-400',
    route: '/ceod/upload',
  },
  {
    id: 'finance',
    name: 'Finance Portal',
    description: 'Upload financial records (AR, AP, Payouts)',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    route: '/ceod/upload',
  },
  {
    id: 'saudemax',
    name: 'SaudeMAX Analytics',
    description: 'Upload member enrollment and engagement data',
    icon: Headphones,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
    route: '/ceod/upload',
  },
];

export function CEODepartmentUploadPortal() {
  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Upload className="w-5 h-5 text-pink-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Upload Portal
            </h1>
          </div>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            Select your department to securely upload data
          </p>
        </div>
        <Link
          to="/ceod/home"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm min-h-[44px] touch-manipulation"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          return (
            <Link
              key={dept.id}
              to={dept.route}
              state={{ department: dept.id }}
              className={`group bg-white rounded-xl shadow-sm border ${dept.borderColor} p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] touch-manipulation`}
            >
              <div className={`w-14 h-14 ${dept.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-7 h-7 ${dept.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {dept.name}
              </h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                {dept.description}
              </p>
              <div className={`flex items-center gap-2 ${dept.color} font-medium text-sm group-hover:gap-3 transition-all`}>
                <span>Upload Data</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
