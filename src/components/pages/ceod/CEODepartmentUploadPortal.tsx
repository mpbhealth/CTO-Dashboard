import { Headphones, MessageSquare, ShoppingCart, Activity, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DepartmentCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  bgColor: string;
  route: string;
}

const DEPARTMENTS: DepartmentCard[] = [
  {
    id: 'concierge',
    name: 'Concierge Portal',
    description: 'Upload member interactions and support touchpoints',
    icon: MessageSquare,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500',
    route: '/ceod/upload',
  },
  {
    id: 'sales',
    name: 'Sales Portal',
    description: 'Upload sales orders and pipeline data',
    icon: ShoppingCart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500',
    route: '/ceod/upload',
  },
  {
    id: 'operations',
    name: 'Operations Portal',
    description: 'Upload cancellation and churn metrics',
    icon: Activity,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500',
    route: '/ceod/upload',
  },
  {
    id: 'finance',
    name: 'Finance Portal',
    description: 'Upload financial records (AR, AP, Payouts)',
    icon: DollarSign,
    color: 'text-green-400',
    bgColor: 'bg-green-500',
    route: '/ceod/upload',
  },
  {
    id: 'saudemax',
    name: 'SaudeMAX Analytics',
    description: 'Upload member enrollment and engagement data',
    icon: Headphones,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
    route: '/ceod/upload',
  },
];

export function CEODepartmentUploadPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-600 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl w-full mx-auto">
        <div className="text-center mb-8 md:mb-12 px-4">
          <div className="mb-6">
            <img
              src="/MPB-Health-No-background.png"
              alt="MPB Health Logo"
              className="h-16 sm:h-20 md:h-24 mx-auto"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Department Data Upload Portal
          </h1>
          <p className="text-lg sm:text-xl text-pink-100">
            Select your department to upload data
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            return (
              <Link
                key={dept.id}
                to={dept.route}
                state={{ department: dept.id }}
                className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-[1.02] sm:hover:scale-105"
              >
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 ${dept.bgColor} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow`}>
                    <Icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {dept.name}
                  </h3>
                  <p className="text-pink-100 text-sm leading-relaxed">
                    {dept.description}
                  </p>
                  <div className="flex items-center gap-2 text-white font-medium pt-2 group-hover:gap-4 transition-all">
                    <span className="text-sm sm:text-base">Upload Data</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 md:mt-12 text-center px-4">
          <Link
            to="/ceod/home"
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all border border-white/20 text-sm sm:text-base"
          >
            <ArrowRight size={18} className="rotate-180" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
