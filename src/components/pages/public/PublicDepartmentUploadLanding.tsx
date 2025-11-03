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
    color: 'text-pink-600',
    bgColor: 'bg-pink-500',
    gradient: 'from-pink-500 to-pink-600',
  },
  {
    id: 'sales',
    name: 'Sales',
    description: 'Upload sales orders and pipeline data',
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Upload cancellation and churn metrics',
    icon: Activity,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    gradient: 'from-amber-500 to-amber-600',
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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="text-center mb-12">
          <div className="mb-8 flex justify-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <img
                src="/MPB-Health-No-background.png"
                alt="MPB Health Logo"
                className="h-20 w-auto"
              />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Department Data Upload Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Select your department to securely upload and submit data to the executive dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            return (
              <button
                key={dept.id}
                onClick={() => handleDepartmentSelect(dept.id)}
                className="group bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:border-pink-500 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center group-hover:border-pink-200 transition-colors">
                    <Icon className={dept.color} size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {dept.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {dept.description}
                  </p>
                  <div className="flex items-center gap-2 text-pink-600 font-medium pt-2 group-hover:gap-3 transition-all">
                    <span>Upload Data</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Why Upload Through Our Portal?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="text-pink-600" size={24} />
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

        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-sm p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            Need Help?
          </h3>
          <p className="text-pink-50 mb-6 max-w-2xl mx-auto">
            If you have questions about uploading data or need assistance, please contact your department administrator or the MPB Health support team.
          </p>
          <div className="flex justify-center">
            <a
              href="mailto:support@mpbhealth.com"
              className="px-6 py-3 bg-white text-pink-600 rounded-lg font-medium hover:bg-pink-50 transition-colors shadow-sm"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
