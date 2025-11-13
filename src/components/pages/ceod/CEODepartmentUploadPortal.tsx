import { Headphones, MessageSquare, ShoppingCart, Activity, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface DepartmentCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  gradient: string;
  borderColor: string;
  route: string;
}

const DEPARTMENTS: DepartmentCard[] = [
  {
    id: 'concierge',
    name: 'Concierge Portal',
    description: 'Upload member interactions and support touchpoints',
    icon: MessageSquare,
    color: 'text-teal-400',
    gradient: 'from-teal-500 via-teal-600 to-cyan-600',
    borderColor: 'border-teal-500/30 hover:border-teal-400',
    route: '/ceod/upload',
  },
  {
    id: 'sales',
    name: 'Sales Portal',
    description: 'Upload sales orders and pipeline data',
    icon: ShoppingCart,
    color: 'text-pink-400',
    gradient: 'from-pink-500 via-pink-600 to-rose-600',
    borderColor: 'border-pink-500/30 hover:border-pink-400',
    route: '/ceod/upload',
  },
  {
    id: 'operations',
    name: 'Operations Portal',
    description: 'Upload cancellation and churn metrics',
    icon: Activity,
    color: 'text-orange-400',
    gradient: 'from-orange-500 via-orange-600 to-amber-600',
    borderColor: 'border-orange-500/30 hover:border-orange-400',
    route: '/ceod/upload',
  },
  {
    id: 'finance',
    name: 'Finance Portal',
    description: 'Upload financial records (AR, AP, Payouts)',
    icon: DollarSign,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 via-emerald-600 to-green-600',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    route: '/ceod/upload',
  },
  {
    id: 'saudemax',
    name: 'SaudeMAX Analytics',
    description: 'Upload member enrollment and engagement data',
    icon: Headphones,
    color: 'text-purple-400',
    gradient: 'from-purple-500 via-purple-600 to-violet-600',
    borderColor: 'border-purple-500/30 hover:border-purple-400',
    route: '/ceod/upload',
  },
];

export function CEODepartmentUploadPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3Cpath d='M40 40h40v40H40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-7xl px-6 py-8"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/10 shadow-2xl">
                <img
                  src="/MPB-Health-No-background.png"
                  alt="MPB Health Logo"
                  className="h-20 w-auto"
                />
              </div>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Department Data <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">Upload Portal</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-slate-300 text-lg font-medium"
          >
            Select your department to securely upload data
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEPARTMENTS.map((dept, index) => {
            const Icon = dept.icon;
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Link
                  to={dept.route}
                  state={{ department: dept.id }}
                  className={`group relative bg-gradient-to-br from-slate-900 via-slate-800 to-black backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 ${dept.borderColor} transition-all duration-300 overflow-hidden block hover:-translate-y-1`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className={`absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br ${dept.gradient} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>

                  <div className="relative">
                    <div className={`w-20 h-20 bg-gradient-to-br ${dept.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl group-hover:shadow-2xl transition-all duration-300 border border-white/10`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight text-center">
                      {dept.name}
                    </h3>
                    <p className="text-slate-300 mb-6 text-sm leading-relaxed text-center">
                      {dept.description}
                    </p>
                    <div className={`flex items-center justify-center ${dept.color} font-semibold group-hover:gap-3 transition-all gap-2`}>
                      <span className="tracking-wide">Upload Data</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Link
            to="/ceod/home"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all border border-white/20 font-medium hover:scale-105"
          >
            <ArrowRight size={18} className="rotate-180" />
            <span>Back to Dashboard</span>
          </Link>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            © 2025 MPB Health. All rights reserved.
          </p>
        </div>
      </motion.div>

      <div className="absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-gradient-to-br from-purple-400/20 via-pink-500/10 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}
