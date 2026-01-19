/**
 * Website Analytics Hooks
 * Fetches analytics data from MPB Health website database
 */
import { useState, useEffect, useCallback } from 'react';
import { mpbHealthSupabase, canFetchMpbHealthData } from '../lib/mpbHealthSupabase';

// Types for analytics data
export interface PageView {
  id: string;
  path: string;
  title: string;
  session_id: string;
  user_id: string | null;
  user_agent: string;
  referrer: string | null;
  country: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  created_at: string;
  time_on_page: number;
  scroll_depth: number;
  is_entry: boolean;
  is_exit: boolean;
}

export interface AnalyticsSession {
  id: string;
  session_id: string;
  user_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  page_count: number;
  is_bounce: boolean;
  entry_page: string;
  exit_page: string | null;
  referrer: string | null;
  referrer_source: 'direct' | 'organic' | 'social' | 'referral' | 'paid' | 'email' | string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string | null;
  country: string;
  region: string | null;
  city: string | null;
  is_new_visitor: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  details: Record<string, unknown>;
  source: string;
  status: 'pending' | 'synced' | 'failed';
  created_at: string;
  synced_at: string | null;
}

// Real-time analytics data
export interface RealTimeData {
  activeNow: number;
  pageViewsLast5Min: number;
  topPage: { path: string; views: number } | null;
  activeCountries: number;
  recentActivity: Array<{
    id: string;
    path: string;
    title: string;
    country: string;
    timestamp: string;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  activeLocations: Array<{ country: string; count: number }>;
}

// Analytics overview data
export interface AnalyticsOverviewData {
  sessions: number;
  sessionsChange: number;
  pageViews: number;
  pageViewsChange: number;
  avgDuration: number;
  avgDurationChange: number;
  bounceRate: number;
  bounceRateChange: number;
  users: number;
  usersChange: number;
  newUsers: number;
  newUsersChange: number;
  returningUsers: number;
  pagesPerSession: number;
  pagesPerSessionChange: number;
  sessionsOverTime: Array<{ date: string; current: number; previous: number }>;
}

// Traffic sources data
export interface TrafficSourceData {
  distribution: Array<{
    source: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  sourcePerformance: Array<{
    source: string;
    sessions: number;
    percentageOfTotal: number;
    change: number;
  }>;
  total: number;
}

// User behavior data
export interface UserBehaviorData {
  bounceRate: number;
  bounceRateChange: number;
  avgDuration: number;
  avgDurationChange: number;
  pagesPerSession: number;
  pagesPerSessionChange: number;
  totalViews: number;
  totalViewsChange: number;
  mostVisitedPages: Array<{
    path: string;
    title: string;
    views: number;
  }>;
}

// Page performance data
export interface PagePerformanceData {
  totalPages: number;
  totalViews: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  pages: Array<{
    path: string;
    title: string;
    views: number;
    uniqueViews: number;
    avgTime: number;
    entries: number;
    exits: number;
    isNew: boolean;
  }>;
}

// Quote leads data
export interface QuoteLeadsData {
  totalSubmissions: number;
  successfullySynced: number;
  pendingSync: number;
  failedSyncs: number;
  submissions: LeadSubmission[];
}

// Date range helper
function getDateRange(range: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const _end = new Date(now);
  let start: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (range) {
    case '7d':
      start = new Date(now.setDate(now.getDate() - 7));
      prevEnd = new Date(start);
      prevStart = new Date(prevEnd.setDate(prevEnd.getDate() - 7));
      break;
    case '30d':
    default:
      start = new Date(now.setDate(now.getDate() - 30));
      prevEnd = new Date(start);
      prevStart = new Date(prevEnd.setDate(prevEnd.getDate() - 30));
      break;
    case '90d':
      start = new Date(now.setDate(now.getDate() - 90));
      prevEnd = new Date(start);
      prevStart = new Date(prevEnd.setDate(prevEnd.getDate() - 90));
      break;
    case '1y':
      start = new Date(now.setFullYear(now.getFullYear() - 1));
      prevEnd = new Date(start);
      prevStart = new Date(prevEnd.setFullYear(prevEnd.getFullYear() - 1));
      break;
  }

  return { start, end: new Date(), prevStart, prevEnd: new Date(start) };
}

// Format duration in seconds to human readable
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}

// Source colors for charts
const SOURCE_COLORS: Record<string, string> = {
  direct: '#3B82F6',
  organic: '#10B981',
  social: '#EC4899',
  referral: '#8B5CF6',
  paid: '#F59E0B',
  email: '#14B8A6',
};

/**
 * Hook for real-time analytics data
 */
export function useRealTimeAnalytics(refreshInterval = 30000) {
  const [data, setData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!canFetchMpbHealthData()) {
      setError('MPB Health database not configured');
      setLoading(false);
      return;
    }

    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Get recent page views (last 5 minutes)
      const { data: recentViews, error: viewsError } = await mpbHealthSupabase
        .from('page_views')
        .select('*')
        .gte('created_at', fiveMinAgo)
        .order('created_at', { ascending: false });

      if (viewsError) throw viewsError;

      const views = recentViews || [];
      
      // Calculate metrics
      const uniqueSessions = new Set(views.map(v => v.session_id));
      const activeNow = uniqueSessions.size;
      const pageViewsLast5Min = views.length;

      // Top page
      const pageCounts: Record<string, { path: string; count: number }> = {};
      views.forEach(v => {
        if (!pageCounts[v.path]) {
          pageCounts[v.path] = { path: v.path, count: 0 };
        }
        pageCounts[v.path].count++;
      });
      const topPageEntry = Object.values(pageCounts).sort((a, b) => b.count - a.count)[0];
      const topPage = topPageEntry ? { path: topPageEntry.path, views: topPageEntry.count } : null;

      // Countries
      const countryCounts: Record<string, number> = {};
      views.forEach(v => {
        countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
      });
      const activeCountries = Object.keys(countryCounts).length;
      const activeLocations = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      // Device breakdown
      const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
      views.forEach(v => {
        if (v.device_type in deviceBreakdown) {
          deviceBreakdown[v.device_type as keyof typeof deviceBreakdown]++;
        }
      });

      // Recent activity (last 20)
      const recentActivity = views.slice(0, 20).map(v => ({
        id: v.id,
        path: v.path,
        title: v.title || v.path,
        country: v.country,
        timestamp: v.created_at,
      }));

      setData({
        activeNow,
        pageViewsLast5Min,
        topPage,
        activeCountries,
        recentActivity,
        deviceBreakdown,
        activeLocations,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch real-time data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for analytics overview data
 */
export function useAnalyticsOverview(dateRange = '30d') {
  const [data, setData] = useState<AnalyticsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!canFetchMpbHealthData()) {
      setError('MPB Health database not configured');
      setLoading(false);
      return;
    }

    try {
      const { start, end, prevStart, prevEnd } = getDateRange(dateRange);

      // Get current period sessions
      const { data: currentSessions, error: sessionsError } = await mpbHealthSupabase
        .from('analytics_sessions')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (sessionsError) throw sessionsError;

      // Get previous period sessions
      const { data: prevSessions, error: prevError } = await mpbHealthSupabase
        .from('analytics_sessions')
        .select('*')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      if (prevError) throw prevError;

      // Get current period page views
      const { data: currentViews, error: viewsError } = await mpbHealthSupabase
        .from('page_views')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (viewsError) throw viewsError;

      // Get previous period page views
      const { data: prevViews, error: prevViewsError } = await mpbHealthSupabase
        .from('page_views')
        .select('*')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      if (prevViewsError) throw prevViewsError;

      const current = currentSessions || [];
      const prev = prevSessions || [];
      const views = currentViews || [];
      const pViews = prevViews || [];

      // Calculate metrics
      const sessions = current.length;
      const prevSessionsCount = prev.length;
      const sessionsChange = prevSessionsCount > 0 
        ? ((sessions - prevSessionsCount) / prevSessionsCount) * 100 
        : 100;

      const pageViews = views.length;
      const prevPageViews = pViews.length;
      const pageViewsChange = prevPageViews > 0 
        ? ((pageViews - prevPageViews) / prevPageViews) * 100 
        : 100;

      const totalDuration = current.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const avgDuration = sessions > 0 ? totalDuration / sessions : 0;
      const prevTotalDuration = prev.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const prevAvgDuration = prevSessionsCount > 0 ? prevTotalDuration / prevSessionsCount : 0;
      const avgDurationChange = prevAvgDuration > 0 
        ? ((avgDuration - prevAvgDuration) / prevAvgDuration) * 100 
        : 100;

      const bounces = current.filter(s => s.is_bounce).length;
      const bounceRate = sessions > 0 ? (bounces / sessions) * 100 : 0;
      const prevBounces = prev.filter(s => s.is_bounce).length;
      const prevBounceRate = prevSessionsCount > 0 ? (prevBounces / prevSessionsCount) * 100 : 0;
      const bounceRateChange = prevBounceRate > 0 
        ? ((bounceRate - prevBounceRate) / prevBounceRate) * 100 
        : 100;

      const uniqueSessionIds = new Set(current.map(s => s.session_id));
      const users = uniqueSessionIds.size;
      const prevUniqueSessionIds = new Set(prev.map(s => s.session_id));
      const prevUsers = prevUniqueSessionIds.size;
      const usersChange = prevUsers > 0 ? ((users - prevUsers) / prevUsers) * 100 : 100;

      const newUsers = current.filter(s => s.is_new_visitor).length;
      const prevNewUsers = prev.filter(s => s.is_new_visitor).length;
      const newUsersChange = prevNewUsers > 0 
        ? ((newUsers - prevNewUsers) / prevNewUsers) * 100 
        : 100;

      const returningUsers = users - newUsers;

      const totalPages = current.reduce((sum, s) => sum + (s.page_count || 0), 0);
      const pagesPerSession = sessions > 0 ? totalPages / sessions : 0;
      const prevTotalPages = prev.reduce((sum, s) => sum + (s.page_count || 0), 0);
      const prevPagesPerSession = prevSessionsCount > 0 ? prevTotalPages / prevSessionsCount : 0;
      const pagesPerSessionChange = prevPagesPerSession > 0 
        ? ((pagesPerSession - prevPagesPerSession) / prevPagesPerSession) * 100 
        : 100;

      // Sessions over time (daily)
      const dailyCurrentSessions: Record<string, number> = {};
      const dailyPrevSessions: Record<string, number> = {};
      
      current.forEach(s => {
        const date = s.created_at.split('T')[0];
        dailyCurrentSessions[date] = (dailyCurrentSessions[date] || 0) + 1;
      });

      prev.forEach(s => {
        const date = s.created_at.split('T')[0];
        dailyPrevSessions[date] = (dailyPrevSessions[date] || 0) + 1;
      });

      const allDates = [...new Set([...Object.keys(dailyCurrentSessions), ...Object.keys(dailyPrevSessions)])].sort();
      const sessionsOverTime = allDates.map(date => ({
        date,
        current: dailyCurrentSessions[date] || 0,
        previous: dailyPrevSessions[date] || 0,
      }));

      setData({
        sessions,
        sessionsChange,
        pageViews,
        pageViewsChange,
        avgDuration,
        avgDurationChange,
        bounceRate,
        bounceRateChange,
        users,
        usersChange,
        newUsers,
        newUsersChange,
        returningUsers,
        pagesPerSession,
        pagesPerSessionChange,
        sessionsOverTime,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics overview');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for traffic sources data
 */
export function useTrafficSources(dateRange = '30d') {
  const [data, setData] = useState<TrafficSourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!canFetchMpbHealthData()) {
      setError('MPB Health database not configured');
      setLoading(false);
      return;
    }

    try {
      const { start, end, prevStart, prevEnd } = getDateRange(dateRange);

      // Get current period sessions
      const { data: currentSessions, error: sessionsError } = await mpbHealthSupabase
        .from('analytics_sessions')
        .select('referrer_source')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (sessionsError) throw sessionsError;

      // Get previous period for comparison
      const { data: prevSessions, error: prevError } = await mpbHealthSupabase
        .from('analytics_sessions')
        .select('referrer_source')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      if (prevError) throw prevError;

      const sessions = currentSessions || [];
      const prev = prevSessions || [];
      const total = sessions.length;

      // Count by source
      const sourceCounts: Record<string, number> = {};
      const prevSourceCounts: Record<string, number> = {};

      sessions.forEach(s => {
        const source = s.referrer_source || 'direct';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });

      prev.forEach(s => {
        const source = s.referrer_source || 'direct';
        prevSourceCounts[source] = (prevSourceCounts[source] || 0) + 1;
      });

      // Format distribution
      const distribution = Object.entries(sourceCounts)
        .map(([source, count]) => ({
          source: source.charAt(0).toUpperCase() + source.slice(1),
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
          color: SOURCE_COLORS[source.toLowerCase()] || '#6B7280',
        }))
        .sort((a, b) => b.count - a.count);

      // Format source performance
      const sourcePerformance = Object.entries(sourceCounts)
        .map(([source, count]) => {
          const prevCount = prevSourceCounts[source] || 0;
          const change = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : 100;
          return {
            source: source.charAt(0).toUpperCase() + source.slice(1),
            sessions: count,
            percentageOfTotal: total > 0 ? (count / total) * 100 : 0,
            change,
          };
        })
        .sort((a, b) => b.sessions - a.sessions);

      setData({ distribution, sourcePerformance, total });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch traffic sources');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for user behavior data
 */
export function useUserBehavior(dateRange = '30d') {
  const [data, setData] = useState<UserBehaviorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!canFetchMpbHealthData()) {
      setError('MPB Health database not configured');
      setLoading(false);
      return;
    }

    try {
      const { start, end, prevStart, prevEnd } = getDateRange(dateRange);

      // Get current sessions
      const { data: currentSessions, error: sessionsError } = await mpbHealthSupabase
        .from('analytics_sessions')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (sessionsError) throw sessionsError;

      // Get previous sessions
      const { data: prevSessions, error: prevError } = await mpbHealthSupabase
        .from('analytics_sessions')
        .select('*')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      if (prevError) throw prevError;

      // Get page views for most visited
      const { data: pageViews, error: viewsError } = await mpbHealthSupabase
        .from('page_views')
        .select('path, title')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (viewsError) throw viewsError;

      // Get previous page views
      const { data: prevViews, error: prevViewsError } = await mpbHealthSupabase
        .from('page_views')
        .select('path')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      if (prevViewsError) throw prevViewsError;

      const current = currentSessions || [];
      const prev = prevSessions || [];
      const views = pageViews || [];
      const pViews = prevViews || [];

      // Calculate metrics
      const bounces = current.filter(s => s.is_bounce).length;
      const bounceRate = current.length > 0 ? (bounces / current.length) * 100 : 0;
      const prevBounces = prev.filter(s => s.is_bounce).length;
      const prevBounceRate = prev.length > 0 ? (prevBounces / prev.length) * 100 : 0;
      const bounceRateChange = prevBounceRate > 0 
        ? ((bounceRate - prevBounceRate) / prevBounceRate) * 100 
        : 100;

      const totalDuration = current.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const avgDuration = current.length > 0 ? totalDuration / current.length : 0;
      const prevTotalDuration = prev.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const prevAvgDuration = prev.length > 0 ? prevTotalDuration / prev.length : 0;
      const avgDurationChange = prevAvgDuration > 0 
        ? ((avgDuration - prevAvgDuration) / prevAvgDuration) * 100 
        : 100;

      const totalPages = current.reduce((sum, s) => sum + (s.page_count || 0), 0);
      const pagesPerSession = current.length > 0 ? totalPages / current.length : 0;
      const prevTotalPages = prev.reduce((sum, s) => sum + (s.page_count || 0), 0);
      const prevPagesPerSession = prev.length > 0 ? prevTotalPages / prev.length : 0;
      const pagesPerSessionChange = prevPagesPerSession > 0 
        ? ((pagesPerSession - prevPagesPerSession) / prevPagesPerSession) * 100 
        : 100;

      const totalViews = views.length;
      const prevTotalViews = pViews.length;
      const totalViewsChange = prevTotalViews > 0 
        ? ((totalViews - prevTotalViews) / prevTotalViews) * 100 
        : 100;

      // Most visited pages
      const pageCounts: Record<string, { path: string; title: string; count: number }> = {};
      views.forEach(v => {
        if (!pageCounts[v.path]) {
          pageCounts[v.path] = { path: v.path, title: v.title || v.path, count: 0 };
        }
        pageCounts[v.path].count++;
      });

      const mostVisitedPages = Object.values(pageCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(p => ({ path: p.path, title: p.title, views: p.count }));

      setData({
        bounceRate,
        bounceRateChange,
        avgDuration,
        avgDurationChange,
        pagesPerSession,
        pagesPerSessionChange,
        totalViews,
        totalViewsChange,
        mostVisitedPages,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user behavior data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for page performance data
 */
export function usePagePerformance(dateRange = '30d') {
  const [data, setData] = useState<PagePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!canFetchMpbHealthData()) {
      setError('MPB Health database not configured');
      setLoading(false);
      return;
    }

    try {
      const { start, end } = getDateRange(dateRange);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get page views
      const { data: pageViews, error: viewsError } = await mpbHealthSupabase
        .from('page_views')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (viewsError) throw viewsError;

      const views = pageViews || [];

      // Aggregate by page
      const pageData: Record<string, {
        path: string;
        title: string;
        views: number;
        uniqueSessions: Set<string>;
        totalTime: number;
        entries: number;
        exits: number;
        firstSeen: string;
      }> = {};

      views.forEach(v => {
        if (!pageData[v.path]) {
          pageData[v.path] = {
            path: v.path,
            title: v.title || v.path,
            views: 0,
            uniqueSessions: new Set(),
            totalTime: 0,
            entries: 0,
            exits: 0,
            firstSeen: v.created_at,
          };
        }
        pageData[v.path].views++;
        pageData[v.path].uniqueSessions.add(v.session_id);
        pageData[v.path].totalTime += v.time_on_page || 0;
        if (v.is_entry) pageData[v.path].entries++;
        if (v.is_exit) pageData[v.path].exits++;
        if (v.created_at < pageData[v.path].firstSeen) {
          pageData[v.path].firstSeen = v.created_at;
        }
      });

      const pages = Object.values(pageData)
        .map(p => ({
          path: p.path,
          title: p.title,
          views: p.views,
          uniqueViews: p.uniqueSessions.size,
          avgTime: p.views > 0 ? p.totalTime / p.views : 0,
          entries: p.entries,
          exits: p.exits,
          isNew: p.firstSeen >= sevenDaysAgo,
        }))
        .sort((a, b) => b.views - a.views);

      const totalViews = views.length;
      const uniqueSessions = new Set(views.map(v => v.session_id));
      const uniqueViews = uniqueSessions.size;
      const totalTime = views.reduce((sum, v) => sum + (v.time_on_page || 0), 0);
      const avgTimeOnPage = totalViews > 0 ? totalTime / totalViews : 0;

      setData({
        totalPages: pages.length,
        totalViews,
        uniqueViews,
        avgTimeOnPage,
        pages,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch page performance');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for quote leads data
 */
export function useQuoteLeads(statusFilter?: 'pending' | 'synced' | 'failed') {
  const [data, setData] = useState<QuoteLeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!canFetchMpbHealthData()) {
      setError('MPB Health database not configured');
      setLoading(false);
      return;
    }

    try {
      // Try to get from lead_submissions table
      let query = mpbHealthSupabase
        .from('lead_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: submissions, error: submissionsError } = await query;

      if (submissionsError) {
        // Table might not exist or be empty, return empty data
        console.warn('Lead submissions table error:', submissionsError);
        setData({
          totalSubmissions: 0,
          successfullySynced: 0,
          pendingSync: 0,
          failedSyncs: 0,
          submissions: [],
        });
        setError(null);
        setLoading(false);
        return;
      }

      const leads = submissions || [];

      // Calculate counts
      const totalSubmissions = leads.length;
      const successfullySynced = leads.filter(l => l.status === 'synced').length;
      const pendingSync = leads.filter(l => l.status === 'pending').length;
      const failedSyncs = leads.filter(l => l.status === 'failed').length;

      setData({
        totalSubmissions,
        successfullySynced,
        pendingSync,
        failedSyncs,
        submissions: leads,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quote leads');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
