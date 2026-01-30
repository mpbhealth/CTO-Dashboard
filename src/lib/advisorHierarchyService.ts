import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Advisor,
  AdvisorTreeNode,
  HierarchyStats,
  Member,
  MemberWithAdvisor,
  MemberQueryOptions,
  MemberListResponse,
  AdvisorHierarchyResponse,
} from '../types/commandCenter';

// ============================================
// Hierarchy Traversal Functions
// ============================================

/**
 * Get all advisor IDs in the downline hierarchy using recursive CTE
 * @param advisorId - The root advisor's agent_id
 * @returns Array of all advisor agent_ids in the hierarchy (including the root)
 */
export async function getDownlineAdvisorIds(advisorId: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    console.warn('[AdvisorHierarchy] Supabase not configured, returning mock data');
    return [advisorId];
  }

  try {
    // Use Supabase RPC to execute recursive CTE query
    const { data, error } = await supabase.rpc('get_downline_advisor_ids', {
      root_advisor_id: advisorId,
    });

    if (error) {
      console.error('[AdvisorHierarchy] Error fetching downline:', error);
      // Fallback to simple query
      return [advisorId];
    }

    // Extract agent_ids from result
    const advisorIds = data?.map((row: { agent_id: string }) => row.agent_id) || [advisorId];
    return advisorIds;
  } catch (err) {
    console.error('[AdvisorHierarchy] Exception:', err);
    return [advisorId];
  }
}

/**
 * Build a tree structure for the advisor hierarchy
 * @param advisorId - The root advisor's agent_id
 * @returns Tree structure with member counts
 */
export async function buildAdvisorTree(advisorId: string): Promise<AdvisorHierarchyResponse> {
  if (!isSupabaseConfigured) {
    return getMockHierarchyResponse(advisorId);
  }

  try {
    // Fetch all advisors in the hierarchy
    const { data: hierarchyData, error: hierarchyError } = await supabase.rpc(
      'get_advisor_hierarchy_tree',
      { root_advisor_id: advisorId }
    );

    if (hierarchyError) {
      console.error('[AdvisorHierarchy] Error building tree:', hierarchyError);
      return getMockHierarchyResponse(advisorId);
    }

    // Fetch member counts for each advisor
    const advisorIds = hierarchyData?.map((a: Advisor) => a.agent_id) || [];
    const memberCounts = await getMemberCountsByAdvisor(advisorIds);

    // Build the tree structure
    const tree = buildTreeFromFlatData(hierarchyData || [], memberCounts, advisorId);
    const stats = calculateHierarchyStats(hierarchyData || [], memberCounts);

    return { tree, stats };
  } catch (err) {
    console.error('[AdvisorHierarchy] Exception building tree:', err);
    return getMockHierarchyResponse(advisorId);
  }
}

/**
 * Get members assigned to advisors in the hierarchy
 * @param advisorId - The root advisor's agent_id
 * @param options - Query options including filters, pagination, and sorting
 * @returns Paginated member list with advisor information
 */
export async function getMembersForHierarchy(
  advisorId: string,
  options: MemberQueryOptions
): Promise<MemberListResponse> {
  const { filters, page, pageSize, sortBy, sortOrder } = options;

  if (!isSupabaseConfigured) {
    return getMockMemberResponse(page, pageSize);
  }

  try {
    // Get advisor IDs based on include_downline flag
    let advisorIds: string[];
    if (filters.include_downline) {
      advisorIds = await getDownlineAdvisorIds(advisorId);
    } else {
      advisorIds = [advisorId];
    }

    // Build the query
    let query = supabase
      .from('member_profiles')
      .select('*, advisor:advisors!assigned_advisor_id(*)', { count: 'exact' })
      .in('assigned_advisor_id', advisorIds);

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.plan_type && filters.plan_type !== 'all') {
      query = query.eq('plan_type', filters.plan_type);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},membership_number.ilike.${searchTerm}`
      );
    }

    if (filters.enrollment_date_from) {
      query = query.gte('enrollment_date', filters.enrollment_date_from);
    }

    if (filters.enrollment_date_to) {
      query = query.lte('enrollment_date', filters.enrollment_date_to);
    }

    if (filters.advisor_id) {
      query = query.eq('assigned_advisor_id', filters.advisor_id);
    }

    // Apply sorting
    const validSortBy = sortBy || 'created_at';
    query = query.order(validSortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[AdvisorHierarchy] Error fetching members:', error);
      return getMockMemberResponse(page, pageSize);
    }

    // Transform data to include advisor info
    const members: MemberWithAdvisor[] = (data || []).map((row) => ({
      ...row,
      full_name: `${row.first_name} ${row.last_name}`,
      assigned_advisor_name: row.advisor?.full_name || 'Unassigned',
    }));

    return {
      data: members,
      count: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  } catch (err) {
    console.error('[AdvisorHierarchy] Exception fetching members:', err);
    return getMockMemberResponse(page, pageSize);
  }
}

/**
 * Get statistics for the hierarchy
 * @param advisorId - The root advisor's agent_id
 * @returns Hierarchy statistics
 */
export async function getHierarchyStats(advisorId: string): Promise<HierarchyStats> {
  if (!isSupabaseConfigured) {
    return getMockHierarchyStats();
  }

  try {
    const { data, error } = await supabase.rpc('get_hierarchy_stats', {
      root_advisor_id: advisorId,
    });

    if (error) {
      console.error('[AdvisorHierarchy] Error getting stats:', error);
      return getMockHierarchyStats();
    }

    return data || getMockHierarchyStats();
  } catch (err) {
    console.error('[AdvisorHierarchy] Exception getting stats:', err);
    return getMockHierarchyStats();
  }
}

// ============================================
// Helper Functions
// ============================================

async function getMemberCountsByAdvisor(
  advisorIds: string[]
): Promise<Map<string, { direct: number; total: number }>> {
  const counts = new Map<string, { direct: number; total: number }>();

  if (!isSupabaseConfigured || advisorIds.length === 0) {
    return counts;
  }

  try {
    const { data, error } = await supabase
      .from('member_profiles')
      .select('assigned_advisor_id')
      .in('assigned_advisor_id', advisorIds);

    if (error) {
      console.error('[AdvisorHierarchy] Error counting members:', error);
      return counts;
    }

    // Count members per advisor
    for (const row of data || []) {
      const advisorId = row.assigned_advisor_id;
      if (advisorId) {
        const current = counts.get(advisorId) || { direct: 0, total: 0 };
        counts.set(advisorId, { direct: current.direct + 1, total: current.total + 1 });
      }
    }

    return counts;
  } catch (err) {
    console.error('[AdvisorHierarchy] Exception counting members:', err);
    return counts;
  }
}

function buildTreeFromFlatData(
  advisors: Advisor[],
  memberCounts: Map<string, { direct: number; total: number }>,
  rootAdvisorId: string
): AdvisorTreeNode {
  // Create a map for quick lookup
  const advisorMap = new Map<string, AdvisorTreeNode>();

  // Initialize all nodes
  for (const advisor of advisors) {
    const counts = memberCounts.get(advisor.agent_id) || { direct: 0, total: 0 };
    advisorMap.set(advisor.agent_id, {
      ...advisor,
      children: [],
      member_count: counts.total,
      direct_member_count: counts.direct,
      downline_member_count: 0,
      expanded: advisor.level < 2, // Auto-expand first two levels
    });
  }

  // Build parent-child relationships
  for (const advisor of advisors) {
    if (advisor.parent_id && advisor.agent_id !== rootAdvisorId) {
      const parent = advisorMap.get(advisor.parent_id);
      const child = advisorMap.get(advisor.agent_id);
      if (parent && child) {
        parent.children.push(child);
      }
    }
  }

  // Calculate downline member counts (bottom-up)
  const calculateDownlineCounts = (node: AdvisorTreeNode): number => {
    let downlineTotal = 0;
    for (const child of node.children) {
      downlineTotal += child.direct_member_count + calculateDownlineCounts(child);
    }
    node.downline_member_count = downlineTotal;
    node.member_count = node.direct_member_count + downlineTotal;
    return downlineTotal;
  };

  const root = advisorMap.get(rootAdvisorId);
  if (root) {
    calculateDownlineCounts(root);
    return root;
  }

  // Return empty root if not found
  return {
    id: rootAdvisorId,
    agent_id: rootAdvisorId,
    agent_label: 'Unknown',
    full_name: 'Unknown Advisor',
    email: '',
    is_active: true,
    level: 0,
    children: [],
    member_count: 0,
    direct_member_count: 0,
    downline_member_count: 0,
    expanded: true,
  };
}

function calculateHierarchyStats(
  advisors: Advisor[],
  memberCounts: Map<string, { direct: number; total: number }>
): HierarchyStats {
  const membersPerLevel: Record<number, number> = {};
  let totalMembers = 0;
  let maxDepth = 0;

  for (const advisor of advisors) {
    const counts = memberCounts.get(advisor.agent_id) || { direct: 0, total: 0 };
    membersPerLevel[advisor.level] = (membersPerLevel[advisor.level] || 0) + counts.direct;
    totalMembers += counts.direct;
    maxDepth = Math.max(maxDepth, advisor.level);
  }

  return {
    total_advisors: advisors.length,
    active_advisors: advisors.filter((a) => a.is_active).length,
    total_members: totalMembers,
    members_per_level: membersPerLevel,
    depth: maxDepth + 1,
  };
}

// ============================================
// Mock Data for Development
// ============================================

function getMockHierarchyResponse(advisorId: string): AdvisorHierarchyResponse {
  const mockTree: AdvisorTreeNode = {
    id: '1',
    agent_id: advisorId,
    agent_label: 'ADV001',
    full_name: 'John Smith',
    email: 'john.smith@example.com',
    is_active: true,
    level: 0,
    children: [
      {
        id: '2',
        agent_id: 'adv-002',
        parent_id: advisorId,
        agent_label: 'ADV002',
        full_name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        is_active: true,
        level: 1,
        children: [
          {
            id: '4',
            agent_id: 'adv-004',
            parent_id: 'adv-002',
            agent_label: 'ADV004',
            full_name: 'Emily Davis',
            email: 'emily.d@example.com',
            is_active: true,
            level: 2,
            children: [],
            member_count: 28,
            direct_member_count: 28,
            downline_member_count: 0,
            expanded: false,
          },
        ],
        member_count: 73,
        direct_member_count: 45,
        downline_member_count: 28,
        expanded: true,
      },
      {
        id: '3',
        agent_id: 'adv-003',
        parent_id: advisorId,
        agent_label: 'ADV003',
        full_name: 'Mike Wilson',
        email: 'mike.w@example.com',
        is_active: true,
        level: 1,
        children: [],
        member_count: 52,
        direct_member_count: 52,
        downline_member_count: 0,
        expanded: true,
      },
    ],
    member_count: 247,
    direct_member_count: 122,
    downline_member_count: 125,
    expanded: true,
  };

  return {
    tree: mockTree,
    stats: getMockHierarchyStats(),
  };
}

function getMockHierarchyStats(): HierarchyStats {
  return {
    total_advisors: 8,
    active_advisors: 7,
    total_members: 247,
    members_per_level: { 0: 122, 1: 97, 2: 28 },
    depth: 3,
  };
}

function getMockMemberResponse(page: number, pageSize: number): MemberListResponse {
  const mockMembers: MemberWithAdvisor[] = Array.from({ length: pageSize }, (_, i) => ({
    id: `member-${page}-${i}`,
    first_name: ['John', 'Jane', 'Robert', 'Maria', 'David', 'Lisa'][i % 6],
    last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'][i % 6],
    full_name: '',
    email: `member${page}${i}@example.com`,
    phone: '(555) 123-4567',
    date_of_birth: '1985-06-15',
    status: ['active', 'active', 'active', 'pending', 'active', 'inactive'][i % 6] as Member['status'],
    plan_type: ['basic', 'standard', 'premium', 'standard', 'basic', 'premium'][i % 6] as Member['plan_type'],
    plan_name: ['Basic Plan', 'Standard Plan', 'Premium Plan'][i % 3],
    assigned_advisor_id: 'adv-001',
    assigned_advisor_name: 'John Smith',
    enrollment_date: '2024-01-15',
    created_at: '2024-01-15T10:30:00Z',
  }));

  // Set full_name
  mockMembers.forEach((m) => {
    m.full_name = `${m.first_name} ${m.last_name}`;
  });

  return {
    data: mockMembers,
    count: 247,
    page,
    pageSize,
    hasMore: page * pageSize < 247,
  };
}

// ============================================
// SQL Functions (to be created in Supabase)
// ============================================

/**
 * SQL function to get all downline advisor IDs
 *
 * CREATE OR REPLACE FUNCTION get_downline_advisor_ids(root_advisor_id TEXT)
 * RETURNS TABLE(agent_id TEXT) AS $$
 * BEGIN
 *   RETURN QUERY
 *   WITH RECURSIVE advisor_tree AS (
 *     SELECT a.agent_id
 *     FROM advisors a
 *     WHERE a.agent_id = root_advisor_id
 *     UNION ALL
 *     SELECT a.agent_id
 *     FROM advisors a
 *     JOIN advisor_tree t ON a.parent_id = t.agent_id
 *     WHERE a.is_active = true
 *   )
 *   SELECT * FROM advisor_tree;
 * END;
 * $$ LANGUAGE plpgsql;
 */

/**
 * SQL function to get hierarchy tree with levels
 *
 * CREATE OR REPLACE FUNCTION get_advisor_hierarchy_tree(root_advisor_id TEXT)
 * RETURNS TABLE(
 *   id UUID,
 *   agent_id TEXT,
 *   parent_id TEXT,
 *   agent_label TEXT,
 *   full_name TEXT,
 *   email TEXT,
 *   phone TEXT,
 *   is_active BOOLEAN,
 *   hire_date TIMESTAMPTZ,
 *   territory TEXT,
 *   level INTEGER
 * ) AS $$
 * BEGIN
 *   RETURN QUERY
 *   WITH RECURSIVE advisor_tree AS (
 *     SELECT a.id, a.agent_id, a.parent_id, a.agent_label, a.full_name,
 *            a.email, a.phone, a.is_active, a.hire_date, a.territory, 0 as level
 *     FROM advisors a
 *     WHERE a.agent_id = root_advisor_id
 *     UNION ALL
 *     SELECT a.id, a.agent_id, a.parent_id, a.agent_label, a.full_name,
 *            a.email, a.phone, a.is_active, a.hire_date, a.territory, t.level + 1
 *     FROM advisors a
 *     JOIN advisor_tree t ON a.parent_id = t.agent_id
 *     WHERE a.is_active = true
 *   )
 *   SELECT * FROM advisor_tree ORDER BY level, full_name;
 * END;
 * $$ LANGUAGE plpgsql;
 */
