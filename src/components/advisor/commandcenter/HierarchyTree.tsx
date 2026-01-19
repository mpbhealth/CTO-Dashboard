import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  User,
  Users,
  UserCheck,
  Building2,
  Filter,
} from 'lucide-react';
import type { AdvisorTreeNode } from '../../../types/commandCenter';

interface HierarchyTreeProps {
  tree: AdvisorTreeNode;
  onAdvisorSelect?: (advisorId: string, advisorName: string) => void;
  selectedAdvisorId?: string;
}

interface TreeNodeProps {
  node: AdvisorTreeNode;
  depth: number;
  onToggle: (nodeId: string) => void;
  onSelect?: (advisorId: string, advisorName: string) => void;
  selectedAdvisorId?: string;
  expandedNodes: Set<string>;
}

const levelColors = [
  { bg: 'bg-cyan-500', ring: 'ring-cyan-200', text: 'text-cyan-700' },
  { bg: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700' },
  { bg: 'bg-violet-500', ring: 'ring-violet-200', text: 'text-violet-700' },
  { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-700' },
  { bg: 'bg-rose-500', ring: 'ring-rose-200', text: 'text-rose-700' },
];

function TreeNode({
  node,
  depth,
  onToggle,
  onSelect,
  selectedAdvisorId,
  expandedNodes,
}: TreeNodeProps) {
  const isExpanded = expandedNodes.has(node.agent_id);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedAdvisorId === node.agent_id;
  const color = levelColors[depth % levelColors.length];

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.agent_id);
  };

  const handleSelect = () => {
    onSelect?.(node.agent_id, node.full_name);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: depth * 0.05 }}
        onClick={handleSelect}
        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-cyan-50 ring-2 ring-cyan-200'
            : 'hover:bg-gray-50'
        }`}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Expand/collapse button */}
        <button
          onClick={handleToggle}
          className={`p-1 rounded-md transition-colors ${
            hasChildren ? 'hover:bg-gray-200 text-gray-500' : 'invisible'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center text-white font-semibold ring-4 ${color.ring}`}
        >
          {node.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{node.full_name}</span>
            <span className="text-xs text-gray-400 font-mono">{node.agent_label}</span>
            {depth === 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 rounded-full">
                You
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">{node.email}</div>
        </div>

        {/* Member counts */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5" title="Direct members">
            <User className={`w-4 h-4 ${color.text}`} />
            <span className="font-semibold text-gray-700">{node.direct_member_count}</span>
          </div>
          {node.downline_member_count > 0 && (
            <div className="flex items-center gap-1.5" title="Downline members">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">+{node.downline_member_count}</span>
            </div>
          )}
          <div
            className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full"
            title="Total members"
          >
            <UserCheck className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-700">{node.member_count}</span>
          </div>
        </div>

        {/* Filter button */}
        {onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect();
            }}
            className={`p-2 rounded-lg transition-colors ${
              isSelected
                ? 'bg-cyan-200 text-cyan-700'
                : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-500'
            }`}
            title="Filter members by this advisor"
          >
            <Filter className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.agent_id}
                node={child}
                depth={depth + 1}
                onToggle={onToggle}
                onSelect={onSelect}
                selectedAdvisorId={selectedAdvisorId}
                expandedNodes={expandedNodes}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HierarchyTree({
  tree,
  onAdvisorSelect,
  selectedAdvisorId,
}: HierarchyTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Auto-expand first two levels
    const expanded = new Set<string>();
    const addExpanded = (node: AdvisorTreeNode, depth: number) => {
      if (depth < 2) {
        expanded.add(node.agent_id);
        node.children?.forEach((child) => addExpanded(child, depth + 1));
      }
    };
    addExpanded(tree, 0);
    return expanded;
  });

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (node: AdvisorTreeNode) => {
      allIds.add(node.agent_id);
      node.children?.forEach(collectIds);
    };
    collectIds(tree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set([tree.agent_id]));
  };

  // Count total advisors
  const countAdvisors = (node: AdvisorTreeNode): number => {
    return 1 + (node.children?.reduce((sum, child) => sum + countAdvisors(child), 0) || 0);
  };
  const totalAdvisors = countAdvisors(tree);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Building2 className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Agent Hierarchy</h3>
            <p className="text-sm text-gray-500">
              {totalAdvisors} advisor{totalAdvisors !== 1 ? 's' : ''} in your organization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-600" />
          <span className="text-gray-600">Direct Members</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Downline Members</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-gray-600" />
          <span className="text-gray-600">Total Members</span>
        </div>
      </div>

      {/* Tree */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <TreeNode
          node={tree}
          depth={0}
          onToggle={handleToggle}
          onSelect={onAdvisorSelect}
          selectedAdvisorId={selectedAdvisorId}
          expandedNodes={expandedNodes}
        />
      </div>

      {/* Footer hint */}
      {onAdvisorSelect && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Click on an advisor to filter the member list by their assigned members
          </p>
        </div>
      )}
    </div>
  );
}
