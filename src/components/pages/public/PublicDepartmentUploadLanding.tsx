import { useNavigate } from 'react-router-dom';
import { Headphones, MessageSquare, ShoppingCart, Activity, DollarSign, ArrowRight, Shield, Clock, CheckCircle } from 'lucide-react';

interface DepartmentCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  bgColor: string;
  gradient: string;
}

const DEPARTMENTS: DepartmentCard[] = [
  {
    id: 'concierge',
    name: 'Concierge',
    description: 'Upload member interactions and support touchpoints',
    icon: MessageSquare,
    color: 'text-teal-600',
    bgColor: 'bg-teal-500',
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    id: 'sales',
    name: 'Sales',
    description: 'Upload sales orders and pipeline data',
    icon: ShoppingCart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Upload cancellation and churn metrics',
    icon: Activity,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Upload financial records (AR, AP, Payouts)',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    gradient: 'from-green-500 to-green-600',
  },
  {
    id: 'saudemax',
    name: 'SaudeMAX',
    description: 'Upload member enrollment and engagement data',
    icon: Headphones,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Secure Upload',
    description: 'Your data is encrypted and securely processed',
  },
  {
    icon: Clock,
    title: 'Fast Processing',
    description: 'Data is validated and imported in real-time',
  },
  {
    icon: CheckCircle,
    title: 'Instant Validation',
    description: 'Get immediate feedback on data quality',
  },
];

export function PublicDepartmentUploadLanding() {
  const navigate = useNavigate();

  const handleDepartmentSelect = (departmentId: string) => {
    navigate(`/public/upload/${departmentId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="mb-6 md:mb-8 flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <img
                src="/MPB-Health-No-background.png"
                alt="MPB Health Logo"
                className="h-16 sm:h-20 w-auto"
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 px-4">
            Department Data Upload Portal
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Select your department to securely upload and submit data to MPB Health
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 lg:mb-16">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            return (
              <button
                key={dept.id}
                onClick={() => handleDepartmentSelect(dept.id)}
                className="group relative bg-white rounded-2xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-pink-200 hover:scale-[1.02] sm:hover:scale-105"
              >
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${dept.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow`}>
                    <Icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {dept.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {dept.description}
                  </p>
                  <div className="flex items-center gap-2 text-pink-600 font-medium pt-2 group-hover:gap-4 transition-all">
                    <span className="text-sm sm:text-base">Upload Data</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${dept.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8 md:mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Why Upload Through Our Portal?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-6 sm:p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            Need Help?
          </h3>
          <p className="text-pink-100 mb-6 max-w-2xl mx-auto">
            If you have questions about uploading data or need assistance, please contact your department administrator or the MPB Health support team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:support@mpbhealth.com"
              className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-pink-600 rounded-lg font-medium hover:bg-pink-50 transition-colors shadow-lg text-sm sm:text-base"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
