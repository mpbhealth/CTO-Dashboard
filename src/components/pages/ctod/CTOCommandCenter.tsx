/**
 * CTO Command Center - Starfleet-inspired Dashboard
 * The nerve center of technology operations
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Radio,
  Rocket,
  Server,
  Shield,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  Users,
  Zap,
  StickyNote,
} from 'lucide-react';
import { useCurrentProfile, useResources, useWorkspace } from '../../../hooks/useDualDashboard';
import { useNotifications } from '../../../hooks/useNotifications';
import { useOutlookCalendar } from '../../../hooks/useOutlookCalendar';
import { useNotes } from '../../../hooks/useNotes';
import { useRealTimeAnalytics, useQuoteLeads } from '../../../hooks/useWebsiteAnalytics';
import { Link } from 'react-router-dom';

// ============================================
// TYPES
// ============================================

interface CommandFeedItem {
  id: string;
  type: 'alert' | 'calendar' | 'lead' | 'note' | 'analytics' | 'deployment' | 'system';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
  color: string;
  action?: { label: string; href: string };
  meta?: Record<string, string | number>;
}

interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: string;
  lastChecked: string;
}

// ============================================
// ANIMATED BACKGROUND COMPONENTS
// ============================================

function CommandCenterBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Radial glow effects */}
      <div
        className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)',
          backgroundSize: '100% 4px',
        }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// STATUS INDICATOR COMPONENTS
// ============================================

function PulsingDot({ color = 'bg-emerald-500', size = 'md' }: { color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <span className={`relative flex ${sizeClasses[size]}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full ${sizeClasses[size]} ${color}`} />
    </span>
  );
}

function StatusBadge({ status }: { status: 'operational' | 'degraded' | 'outage' }) {
  const config = {
    operational: { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'ONLINE' },
    degraded: { color: 'bg-amber-500', text: 'text-amber-400', label: 'DEGRADED' },
    outage: { color: 'bg-red-500', text: 'text-red-400', label: 'OFFLINE' },
  };

  const { color, text, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <PulsingDot color={color} size="sm" />
      <span className={`text-xs font-mono font-bold ${text}`}>{label}</span>
    </div>
  );
}

// ============================================
// METRIC CARD COMPONENTS
// ============================================

function TacticalMetricCard({
  title,
  value,
  trend,
  trendDirection,
  icon: Icon,
  color,
  subtitle,
  onClick,
}: {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br from-slate-800/80 to-slate-900/80
        backdrop-blur-xl border border-slate-700/50
        p-4 cursor-pointer group
        hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10
        transition-all duration-300
      `}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${color} blur-xl`} style={{ opacity: 0.05 }} />

      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color}`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          {trend && (
            <span className={`text-xs font-mono font-semibold ${trendColors[trendDirection || 'neutral']}`}>
              {trend}
            </span>
          )}
        </div>

        <div className="text-2xl font-bold text-white font-mono mb-1">
          {value}
        </div>

        <div className="text-xs text-slate-400 uppercase tracking-wider">
          {title}
        </div>

        {subtitle && (
          <div className="text-[10px] text-slate-500 mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// COMMAND FEED COMPONENT
// ============================================

function CommandFeed({ items, maxItems = 10 }: { items: CommandFeedItem[]; maxItems?: number }) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'alerts' | 'leads'>('all');

  const filteredItems = useMemo(() => {
    let filtered = items;

    switch (filter) {
      case 'critical':
        filtered = items.filter(i => i.priority === 'critical' || i.priority === 'high');
        break;
      case 'alerts':
        filtered = items.filter(i => i.type === 'alert' || i.type === 'system');
        break;
      case 'leads':
        filtered = items.filter(i => i.type === 'lead' || i.type === 'analytics');
        break;
    }

    return filtered.slice(0, maxItems);
  }, [items, filter, maxItems]);

  const priorityStyles = {
    critical: 'border-l-red-500 bg-red-500/5',
    high: 'border-l-amber-500 bg-amber-500/5',
    medium: 'border-l-cyan-500 bg-cyan-500/5',
    low: 'border-l-slate-500 bg-slate-500/5',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Command Feed</h2>
            <p className="text-xs text-slate-400">Real-time intelligence stream</p>
          </div>
        </div>
        <PulsingDot color="bg-cyan-500" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-slate-800/50 rounded-lg">
        {[
          { id: 'all', label: 'All' },
          { id: 'critical', label: 'Priority' },
          { id: 'alerts', label: 'Alerts' },
          { id: 'leads', label: 'Leads' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${filter === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Items */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500/50" />
              <p className="text-sm">All clear, Commander</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative p-3 rounded-lg border-l-2
                    ${priorityStyles[item.priority]}
                    bg-slate-800/30 backdrop-blur
                    hover:bg-slate-800/50 transition-all
                    cursor-pointer group
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${item.color} flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white truncate">
                          {item.title}
                        </span>
                        {item.priority === 'critical' && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
                            URGENT
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatTimeAgo(item.timestamp)}
                        </span>

                        {item.action && (
                          <Link
                            to={item.action.href}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {item.action.label}
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// SYSTEM STATUS PANEL
// ============================================

function SystemStatusPanel({ systems }: { systems: SystemStatus[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Status</h3>
      </div>

      {systems.map((system) => (
        <div
          key={system.name}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
        >
          <div className="flex items-center gap-3">
            <StatusBadge status={system.status} />
            <span className="text-sm text-white font-medium">{system.name}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-400 font-mono">{system.uptime}</div>
            <div className="text-[10px] text-slate-500">{system.lastChecked}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// CALENDAR PREVIEW COMPONENT
// ============================================

function CalendarPreview({ events }: { events: Array<{ id: string; subject: string; start: string; end: string; isAllDay?: boolean }> }) {
  const todayEvents = events.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today's Agenda</h3>
        </div>
        <Link to="/ctod/development/organizer" className="text-xs text-cyan-400 hover:text-cyan-300">
          View All
        </Link>
      </div>

      {todayEvents.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No events scheduled</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todayEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-purple-500/30 transition-colors"
            >
              <div className="w-1 h-10 rounded-full bg-gradient-to-b from-purple-500 to-cyan-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{event.subject}</p>
                <p className="text-xs text-slate-400 font-mono">
                  {event.isAllDay ? 'All Day' : formatEventTime(event.start, event.end)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// LIVE ANALYTICS WIDGET
// ============================================

function LiveAnalyticsWidget({
  activeUsers,
  pageViews,
  topPage,
  recentActivity,
}: {
  activeUsers: number;
  pageViews: number;
  topPage: { path: string; views: number } | null;
  recentActivity: Array<{ id: string; path: string; country: string; timestamp: string }>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Traffic</h3>
        </div>
        <div className="flex items-center gap-2">
          <PulsingDot color="bg-emerald-500" size="sm" />
          <span className="text-xs text-emerald-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-2xl font-bold text-emerald-400 font-mono">{activeUsers}</div>
          <div className="text-[10px] text-emerald-400/70 uppercase">Active Now</div>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <div className="text-2xl font-bold text-cyan-400 font-mono">{pageViews}</div>
          <div className="text-[10px] text-cyan-400/70 uppercase">Views (5m)</div>
        </div>
      </div>

      {/* Top Page */}
      {topPage && (
        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Top Page</span>
          </div>
          <div className="text-sm text-white font-medium truncate">{topPage.path}</div>
          <div className="text-xs text-amber-400 font-mono">{topPage.views} views</div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="space-y-1.5">
        {recentActivity.slice(0, 4).map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/20 text-xs"
          >
            <Globe className="w-3 h-3 text-slate-500" />
            <span className="text-slate-300 truncate flex-1">{activity.path}</span>
            <span className="text-slate-500">{activity.country}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// QUICK ACTIONS PANEL
// ============================================

function QuickActionsPanel() {
  const actions = [
    { icon: Rocket, label: 'Deploy', href: '/ctod/infrastructure/deployments', color: 'from-cyan-500 to-blue-600' },
    { icon: Shield, label: 'Security', href: '/ctod/compliance', color: 'from-emerald-500 to-teal-600' },
    { icon: LayoutDashboard, label: 'Analytics', href: '/ctod/analytics', color: 'from-purple-500 to-pink-600' },
    { icon: FileText, label: 'Notes', href: '/ctod/development/notepad', color: 'from-amber-500 to-orange-600' },
    { icon: Terminal, label: 'API Status', href: '/ctod/infrastructure/api-status', color: 'from-slate-500 to-slate-600' },
    { icon: Target, label: 'Roadmap', href: '/ctod/development/roadmap', color: 'from-rose-500 to-red-600' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatEventTime(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CTOCommandCenter() {
  const { data: profile } = useCurrentProfile();
  const { data: workspace } = useWorkspace(profile?.org_id || '', 'CTO', 'CTO Workspace');
  const { data: _resources = [] } = useResources({ workspaceId: workspace?.id });
  const { notifications = [] } = useNotifications();
  const { events: calendarEvents = [], getTodayEvents } = useOutlookCalendar();
  const { myNotes = [], sharedNotes = [] } = useNotes({ dashboardRole: 'cto' });
  const { data: realTimeData } = useRealTimeAnalytics();
  const { data: leadsData } = useQuoteLeads();
  const leads = useMemo(() => leadsData?.submissions || [], [leadsData]);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get today's calendar events
  const todayEvents = useMemo(() => {
    if (getTodayEvents) {
      return getTodayEvents();
    }
    return calendarEvents.filter(e => {
      const eventDate = new Date(e.start.dateTime || e.start.date || '');
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    });
  }, [calendarEvents, getTodayEvents]);

  // Build unified command feed
  const commandFeedItems = useMemo<CommandFeedItem[]>(() => {
    const items: CommandFeedItem[] = [];

    // Add notifications
    notifications?.forEach((n: { id: string; notification_type: string; priority: string; title: string; message: string; created_at: string }) => {
      items.push({
        id: `notif-${n.id}`,
        type: n.notification_type === 'system_incident' ? 'system' : 'alert',
        priority: n.priority === 'critical' ? 'critical' : n.priority === 'high' ? 'high' : 'medium',
        title: n.title,
        description: n.message,
        timestamp: new Date(n.created_at),
        icon: n.priority === 'critical' ? AlertTriangle : Bell,
        color: n.priority === 'critical' ? 'bg-red-500' : 'bg-amber-500',
        action: { label: 'View', href: '/ctod/notifications' },
      });
    });

    // Add calendar events for today
    todayEvents?.forEach((e: { id: string; subject: string; start: { dateTime?: string; date?: string } }) => {
      items.push({
        id: `cal-${e.id}`,
        type: 'calendar',
        priority: 'medium',
        title: e.subject || 'Untitled Event',
        description: `Scheduled for ${new Date(e.start.dateTime || e.start.date || '').toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        timestamp: new Date(e.start.dateTime || e.start.date || ''),
        icon: Calendar,
        color: 'bg-purple-500',
        action: { label: 'Open', href: '/ctod/development/organizer' },
      });
    });

    // Add website leads
    leads?.forEach((l: { id: string; name: string; email: string; source: string; created_at: string }) => {
      items.push({
        id: `lead-${l.id}`,
        type: 'lead',
        priority: 'high',
        title: `New Lead: ${l.name}`,
        description: `${l.email} via ${l.source}`,
        timestamp: new Date(l.created_at),
        icon: Users,
        color: 'bg-emerald-500',
        action: { label: 'View', href: '/ctod/analytics/website' },
      });
    });

    // Add recent notes activity
    [...(myNotes || []), ...(sharedNotes || [])].slice(0, 5).forEach((n: { id: string; title?: string; content: string; updated_at: string }) => {
      items.push({
        id: `note-${n.id}`,
        type: 'note',
        priority: 'low',
        title: n.title || 'Untitled Note',
        description: n.content.substring(0, 100) + '...',
        timestamp: new Date(n.updated_at),
        icon: StickyNote,
        color: 'bg-slate-500',
        action: { label: 'Open', href: '/ctod/development/notepad' },
      });
    });

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notifications, todayEvents, leads, myNotes, sharedNotes]);

  // System status mock data (would come from real monitoring)
  const systemStatus: SystemStatus[] = [
    { name: 'Production API', status: 'operational', uptime: '99.99%', lastChecked: '2s ago' },
    { name: 'Database Cluster', status: 'operational', uptime: '99.95%', lastChecked: '5s ago' },
    { name: 'CDN / Edge', status: 'operational', uptime: '100%', lastChecked: '3s ago' },
    { name: 'Auth Services', status: 'operational', uptime: '99.98%', lastChecked: '1s ago' },
  ];

  // Key metrics
  const metrics = [
    {
      title: 'System Uptime',
      value: '99.9%',
      trend: '+0.1%',
      trendDirection: 'up' as const,
      icon: Server,
      color: 'from-emerald-500 to-teal-600',
      subtitle: 'Last 30 days',
    },
    {
      title: 'Active Sessions',
      value: realTimeData?.activeNow || 0,
      trend: `+${realTimeData?.pageViewsLast5Min || 0}`,
      trendDirection: 'up' as const,
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      subtitle: 'Real-time visitors',
    },
    {
      title: 'New Leads',
      value: leads?.length || 0,
      trend: 'Today',
      trendDirection: 'neutral' as const,
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      subtitle: 'Website conversions',
    },
    {
      title: 'Deployments',
      value: 47,
      trend: '+8',
      trendDirection: 'up' as const,
      icon: Rocket,
      color: 'from-amber-500 to-orange-600',
      subtitle: 'Last 30 days',
    },
    {
      title: 'Open Tickets',
      value: 12,
      trend: '-3',
      trendDirection: 'down' as const,
      icon: MessageSquare,
      color: 'from-rose-500 to-red-600',
      subtitle: 'Requiring attention',
    },
    {
      title: 'Security Score',
      value: 'A+',
      trend: 'Excellent',
      trendDirection: 'up' as const,
      icon: Shield,
      color: 'from-slate-500 to-slate-700',
      subtitle: 'Compliance status',
    },
  ];

  return (
    <div className="relative min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <CommandCenterBackground />

      <div className="relative z-10 max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Command Center
                  </h1>
                  <p className="text-sm text-slate-400">
                    Welcome back, Commander {profile?.display_name || 'Vinnie'}
                  </p>
                </div>
              </div>
            </div>

            {/* Time Display */}
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-cyan-400">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-xs text-slate-500 font-mono uppercase">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-4 mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <div className="flex items-center gap-2">
              <PulsingDot color="bg-emerald-500" />
              <span className="text-xs text-emerald-400 font-mono">ALL SYSTEMS OPERATIONAL</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Bell className="w-3 h-3" />
              <span>{notifications?.length || 0} alerts</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{todayEvents?.length || 0} events today</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Eye className="w-3 h-3" />
              <span>{realTimeData?.activeNow || 0} visitors live</span>
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Tactical Metrics Row */}
          <motion.div
            className="col-span-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.map((metric) => (
                <TacticalMetricCard
                  key={metric.title}
                  {...metric}
                />
              ))}
            </div>
          </motion.div>

          {/* Command Feed - Left Column */}
          <motion.div
            className="col-span-12 lg:col-span-5 xl:col-span-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="h-[600px] p-5 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50">
              <CommandFeed items={commandFeedItems} maxItems={15} />
            </div>
          </motion.div>

          {/* Center & Right Panels */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-8 grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50"
            >
              <SystemStatusPanel systems={systemStatus} />
            </motion.div>

            {/* Live Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50"
            >
              <LiveAnalyticsWidget
                activeUsers={realTimeData?.activeNow || 0}
                pageViews={realTimeData?.pageViewsLast5Min || 0}
                topPage={realTimeData?.topPage || null}
                recentActivity={realTimeData?.recentActivity || []}
              />
            </motion.div>

            {/* Calendar Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-5 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50"
            >
              <CalendarPreview
                events={todayEvents?.map((e: { id: string; subject: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string }; isAllDay?: boolean }) => ({
                  id: e.id,
                  subject: e.subject,
                  start: e.start.dateTime || e.start.date || '',
                  end: e.end.dateTime || e.end.date || '',
                  isAllDay: e.isAllDay,
                })) || []}
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-5 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50"
            >
              <QuickActionsPanel />
            </motion.div>
          </div>
        </div>

        {/* Footer Status */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-xs text-slate-600 font-mono">
            MPB HEALTH TECHNOLOGY COMMAND CENTER • STARDATE {Math.floor(Date.now() / 86400000)}.{Math.floor((Date.now() % 86400000) / 3600000)}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default CTOCommandCenter;
