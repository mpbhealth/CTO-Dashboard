import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MemberStatusUpdate {
  id: string;
  member_id: string;
  status_date: string;
  new_status: 'active' | 'inactive' | 'lapsed' | 'churned' | 'on_hold' | 'suspended';
  reason: string | null;
  source_system: string | null;
  created_at: string;
  updated_at: string;
}

export function useMemberStatusData() {
  const [data, setData] = useState<MemberStatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: statusData, error } = await supabase
        .from('member_status_updates')
        .select('*')
        .order('status_date', { ascending: false });

      if (error) throw error;
      setData(statusData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// Utility functions for member status analytics

/**
 * Gets the count of members by status
 */
export function getStatusCounts(data: MemberStatusUpdate[]): Record<string, number> {
  // Get the latest status for each member
  const latestByMember = new Map<string, MemberStatusUpdate>();
  
  data.forEach(update => {
    const existing = latestByMember.get(update.member_id);
    if (!existing || new Date(update.status_date) > new Date(existing.status_date)) {
      latestByMember.set(update.member_id, update);
    }
  });
  
  // Count by status
  const counts: Record<string, number> = {
    active: 0,
    inactive: 0,
    lapsed: 0,
    churned: 0,
    on_hold: 0,
    suspended: 0
  };
  
  latestByMember.forEach(update => {
    counts[update.new_status] = (counts[update.new_status] || 0) + 1;
  });
  
  return counts;
}

/**
 * Gets the count of status changes over time
 */
export function getStatusChangeTimeline(data: MemberStatusUpdate[]): {
  date: string;
  activations: number;
  deactivations: number;
}[] {
  // Group updates by date (YYYY-MM-DD)
  const updatesByDate = new Map<string, { activations: number; deactivations: number }>();
  
  data.forEach(update => {
    const date = new Date(update.status_date).toISOString().split('T')[0];
    const current = updatesByDate.get(date) || { activations: 0, deactivations: 0 };
    
    if (update.new_status === 'active') {
      current.activations++;
    } else {
      current.deactivations++;
    }
    
    updatesByDate.set(date, current);
  });
  
  // Convert to array and sort by date
  const timeline = Array.from(updatesByDate.entries())
    .map(([date, counts]) => ({ 
      date, 
      ...counts 
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
    
  return timeline;
}