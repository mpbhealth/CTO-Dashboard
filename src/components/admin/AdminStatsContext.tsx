import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { mpbHealthSupabase, isMpbHealthConfigured } from '../../lib/mpbHealthSupabase';

interface AdminStats {
  // Members
  total_members: number;
  active_members: number;
  pending_members: number;
  
  // Claims
  pending_claims: number;
  total_claims_this_month: number;
  claims_under_review: number;
  
  // Support
  pending_support_tickets: number;
  unresolved_tickets: number;
  critical_tickets: number;
  
  // Revenue
  total_revenue_this_month: number;
  pending_transactions: number;
  
  // Content
  total_blog_articles: number;
  published_articles: number;
  draft_articles: number;
}

interface AdminStatsContextType {
  stats: AdminStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  lastUpdated: Date | null;
}

const defaultStats: AdminStats = {
  total_members: 0,
  active_members: 0,
  pending_members: 0,
  pending_claims: 0,
  total_claims_this_month: 0,
  claims_under_review: 0,
  pending_support_tickets: 0,
  unresolved_tickets: 0,
  critical_tickets: 0,
  total_revenue_this_month: 0,
  pending_transactions: 0,
  total_blog_articles: 0,
  published_articles: 0,
  draft_articles: 0,
};

// Demo stats for when Supabase isn't configured
const demoStats: AdminStats = {
  total_members: 1247,
  active_members: 1089,
  pending_members: 42,
  pending_claims: 23,
  total_claims_this_month: 156,
  claims_under_review: 18,
  pending_support_tickets: 12,
  unresolved_tickets: 31,
  critical_tickets: 3,
  total_revenue_this_month: 284750,
  pending_transactions: 8,
  total_blog_articles: 47,
  published_articles: 38,
  draft_articles: 9,
};

const AdminStatsContext = createContext<AdminStatsContextType | undefined>(undefined);

interface AdminStatsProviderProps {
  children: ReactNode;
  autoRefreshInterval?: number;
}

export function AdminStatsProvider({ 
  children, 
  autoRefreshInterval = 120000 // 2 minutes
}: AdminStatsProviderProps) {
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isMpbHealthConfigured) {
      // Use demo data when MPB Health Supabase isn't configured
      setStats(demoStats);
      setLoading(false);
      setLastUpdated(new Date());
      return;
    }

    try {
      setError(null);

      // Fetch member stats from MPB Health backend
      const [
        { count: totalMembers },
        { count: activeMembers },
        { count: pendingMembers }
      ] = await Promise.all([
        mpbHealthSupabase.from('member_profiles').select('*', { count: 'exact', head: true }),
        mpbHealthSupabase.from('member_profiles').select('*', { count: 'exact', head: true }).eq('membership_status', 'active'),
        mpbHealthSupabase.from('member_profiles').select('*', { count: 'exact', head: true }).eq('membership_status', 'pending'),
      ]);

      // Fetch claims stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        { count: pendingClaims },
        { count: totalClaimsThisMonth },
        { count: claimsUnderReview }
      ] = await Promise.all([
        mpbHealthSupabase.from('claims').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'pending_info']),
        mpbHealthSupabase.from('claims').select('*', { count: 'exact', head: true }).gte('submitted_date', startOfMonth.toISOString()),
        mpbHealthSupabase.from('claims').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
      ]);

      // Fetch support ticket stats
      const [
        { count: pendingTickets },
        { count: unresolvedTickets },
        { count: criticalTickets }
      ] = await Promise.all([
        mpbHealthSupabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        mpbHealthSupabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'waiting_member']),
        mpbHealthSupabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'urgent'),
      ]);

      // Fetch transaction stats
      const [
        { data: revenueData },
        { count: pendingTransactions }
      ] = await Promise.all([
        mpbHealthSupabase.from('transactions')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', startOfMonth.toISOString()),
        mpbHealthSupabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const totalRevenue = revenueData?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

      // Fetch blog stats
      const [
        { count: totalArticles },
        { count: publishedArticles },
        { count: draftArticles }
      ] = await Promise.all([
        mpbHealthSupabase.from('blog_articles').select('*', { count: 'exact', head: true }),
        mpbHealthSupabase.from('blog_articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        mpbHealthSupabase.from('blog_articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      ]);

      setStats({
        total_members: totalMembers || 0,
        active_members: activeMembers || 0,
        pending_members: pendingMembers || 0,
        pending_claims: pendingClaims || 0,
        total_claims_this_month: totalClaimsThisMonth || 0,
        claims_under_review: claimsUnderReview || 0,
        pending_support_tickets: pendingTickets || 0,
        unresolved_tickets: unresolvedTickets || 0,
        critical_tickets: criticalTickets || 0,
        total_revenue_this_month: totalRevenue,
        pending_transactions: pendingTransactions || 0,
        total_blog_articles: totalArticles || 0,
        published_articles: publishedArticles || 0,
        draft_articles: draftArticles || 0,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load statistics');
      // Fall back to demo stats on error
      setStats(demoStats);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchStats, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, autoRefreshInterval]);

  const value = {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
    lastUpdated,
  };

  return (
    <AdminStatsContext.Provider value={value}>
      {children}
    </AdminStatsContext.Provider>
  );
}

export function useAdminStats() {
  const context = useContext(AdminStatsContext);
  if (context === undefined) {
    throw new Error('useAdminStats must be used within an AdminStatsProvider');
  }
  return context;
}

export default AdminStatsContext;

