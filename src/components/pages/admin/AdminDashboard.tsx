import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  DollarSign,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Bell,
  Settings,
  TrendingUp,
  Shield,
  UserCheck,
  Activity,
  ExternalLink,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminStats } from '../../admin/AdminStatsContext';

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  color: string;
  badge?: number;
  urgent?: boolean;
}

function QuickAccessCard({ title, description, icon: Icon, link, color, badge, urgent }: QuickAccessCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(link)}
      className={`
        relative group p-5 rounded-2xl bg-white border border-slate-200
        hover:shadow-lg hover:border-slate-300 hover:-translate-y-1
        transition-all duration-300 ease-out
        text-left w-full
        ${urgent && badge && badge > 0 ? 'ring-2 ring-red-500/20' : ''}
      `}
    >
      {/* Urgent indicator */}
      {urgent && badge && badge > 0 && (
        <span className="absolute top-3 right-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </span>
      )}

      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center mb-4
        bg-gradient-to-br ${color}
      `}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{description}</p>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className={`
            px-2.5 py-1 text-sm font-bold rounded-full flex-shrink-0
            ${urgent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}
          `}>
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700">
        <span>Manage</span>
        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, icon: Icon, color, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`
            flex items-center text-sm font-medium px-2 py-1 rounded-full
            ${trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
          `}>
            <TrendingUp className={`w-3.5 h-3.5 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const { stats, loading } = useAdminStats();

  const quickAccessItems: QuickAccessCardProps[] = [
    {
      title: 'Member Management',
      description: 'View and manage all member accounts, profiles, and coverage',
      icon: Users,
      link: '/admin/members',
      color: 'from-blue-500 to-blue-600',
      badge: stats.total_members,
    },
    {
      title: 'Claims Processing',
      description: 'Review, approve, and process member claims',
      icon: FileText,
      link: '/admin/claims',
      color: 'from-purple-500 to-purple-600',
      badge: stats.pending_claims,
      urgent: true,
    },
    {
      title: 'Support Tickets',
      description: 'Manage customer support requests and inquiries',
      icon: AlertCircle,
      link: '/admin/support',
      color: 'from-rose-500 to-rose-600',
      badge: stats.pending_support_tickets,
      urgent: true,
    },
    {
      title: 'Transactions',
      description: 'View payment history and financial transactions',
      icon: DollarSign,
      link: '/admin/transactions',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Blog Management',
      description: 'Create and manage blog articles and content',
      icon: BookOpen,
      link: '/admin/blog',
      color: 'from-amber-500 to-amber-600',
      badge: stats.draft_articles,
    },
    {
      title: 'FAQ Management',
      description: 'Update frequently asked questions',
      icon: HelpCircle,
      link: '/admin/faq',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      title: 'Notifications',
      description: 'Send system-wide notifications to members',
      icon: Bell,
      link: '/admin/notifications',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'System Settings',
      description: 'Configure site settings and preferences',
      icon: Settings,
      link: '/admin/settings',
      color: 'from-slate-600 to-slate-700',
    },
  ];

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {greeting}, {profile?.display_name?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://support.mpb.health/login/staff"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Help Center
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Urgent Actions Alert */}
      {(stats.pending_claims > 0 || stats.pending_support_tickets > 0 || stats.critical_tickets > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-xl flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Urgent Actions Required</h3>
              <div className="mt-2 flex flex-wrap gap-3">
                {stats.pending_claims > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full">
                    <FileText className="w-4 h-4" />
                    {stats.pending_claims} pending claims
                  </span>
                )}
                {stats.pending_support_tickets > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full">
                    <AlertCircle className="w-4 h-4" />
                    {stats.pending_support_tickets} open tickets
                  </span>
                )}
                {stats.critical_tickets > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full font-semibold">
                    <Activity className="w-4 h-4" />
                    {stats.critical_tickets} critical priority
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={loading ? '...' : stats.total_members.toLocaleString()}
          icon={Users}
          color="from-blue-500 to-blue-600"
          subtitle={`${stats.active_members} active`}
        />
        <StatCard
          title="Claims This Month"
          value={loading ? '...' : stats.total_claims_this_month.toLocaleString()}
          icon={FileText}
          color="from-purple-500 to-purple-600"
          subtitle={`${stats.claims_under_review} under review`}
        />
        <StatCard
          title="Revenue MTD"
          value={loading ? '...' : new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD', 
            maximumFractionDigits: 0 
          }).format(stats.total_revenue_this_month)}
          icon={DollarSign}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Support Tickets"
          value={loading ? '...' : stats.unresolved_tickets.toLocaleString()}
          icon={AlertCircle}
          color="from-rose-500 to-rose-600"
          subtitle="Unresolved"
        />
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickAccessItems.map((item) => (
            <QuickAccessCard key={item.title} {...item} />
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="https://support.mpb.health/login/staff"
          target="_blank"
          rel="noopener noreferrer"
          className="group p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Need Help?</h3>
              <p className="text-slate-300 text-sm mt-1">Access the staff support portal</p>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </a>

        <a
          href="https://support.mpb.health/"
          target="_blank"
          rel="noopener noreferrer"
          className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">IT Support Portal</h3>
              <p className="text-emerald-100 text-sm mt-1">MPB Health IT Support Login</p>
            </div>
            <ExternalLink className="w-5 h-5 text-emerald-200 group-hover:text-white transition-colors" />
          </div>
        </a>
      </div>
    </div>
  );
}

export default AdminDashboard;

