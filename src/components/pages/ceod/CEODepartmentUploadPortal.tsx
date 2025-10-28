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
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-600 flex flex-col items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="mb-6">
            <img
              src="/MPB-Health-No-background.png"
              alt="MPB Health Logo"
              className="h-24 mx-auto"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Department Data Upload Portal
          </h1>
          <p className="text-xl text-blue-100">
            Select your department to upload data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            return (
              <Link
                key={dept.id}
                to={dept.route}
                state={{ department: dept.id }}
                className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-20 h-20 ${dept.bgColor} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow`}>
                    <Icon className="text-white" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {dept.name}
                  </h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    {dept.description}
                  </p>
                  <div className="flex items-center gap-2 text-white font-medium pt-2 group-hover:gap-4 transition-all">
                    <span>Upload Data</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/ceod/home"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all border border-white/20"
          >
            <ArrowRight size={20} className="rotate-180" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
