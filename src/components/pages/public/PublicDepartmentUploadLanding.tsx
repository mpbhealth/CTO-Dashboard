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
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-pink-50/30 overflow-x-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.03),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.02),transparent_50%)] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="text-center mb-16">
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl blur-xl opacity-20" />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8">
                <img
                  src="/MPB-Health-No-background.png"
                  alt="MPB Health Logo"
                  className="h-20 w-auto"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
              Department Data Upload Portal
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Select your department to securely upload and submit data to the executive dashboard
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            return (
              <button
                key={dept.id}
                onClick={() => handleDepartmentSelect(dept.id)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-200/50 hover:border-pink-400/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:to-pink-500/10 rounded-2xl transition-all duration-300" />
                <div className="relative flex flex-col items-center text-center space-y-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl flex items-center justify-center group-hover:border-pink-300 group-hover:shadow-lg transition-all duration-300">
                    <Icon className={dept.color} size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {dept.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {dept.description}
                  </p>
                  <div className="flex items-center gap-2 text-pink-600 font-semibold pt-3 group-hover:gap-3 transition-all">
                    <span>Upload Data</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-10 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Why Upload Through Our Portal?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-50 rounded-2xl flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <Icon className="text-pink-600" size={28} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl shadow-lg p-10 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="relative">
            <h3 className="text-3xl font-bold mb-4">
              Need Help?
            </h3>
            <p className="text-pink-50 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              If you have questions about uploading data or need assistance, please contact your department administrator or the MPB Health support team.
            </p>
            <div className="flex justify-center">
              <a
                href="mailto:support@mpbhealth.com"
                className="px-8 py-4 bg-white text-pink-600 rounded-xl font-semibold hover:bg-pink-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
