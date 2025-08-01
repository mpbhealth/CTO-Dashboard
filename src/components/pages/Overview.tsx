import React, { useState } from 'react';
import KPICard from '../ui/KPICard';
import { useKPIData, useTeamMembers } from '../../hooks/useSupabaseData';
import { Users, Building, MapPin, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import AddTeamMemberModal from '../modals/AddTeamMemberModal';
import EditTeamMemberModal from '../modals/EditTeamMemberModal';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

export default function Overview() {
  const { data: kpiData, loading: kpiLoading, error: kpiError } = useKPIData();
  const { data: teamMembers, loading: teamLoading, error: teamError, refetch: refetchTeam } = useTeamMembers();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const loading = kpiLoading || teamLoading;
  const error = kpiError || teamError;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading data: {error}</p>
          <p className="text-slate-600">Please make sure you're connected to Supabase.</p>
        </div>
      </div>
    );
  }

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (window.confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', member.id);

        if (error) throw error;
        refetchTeam();
      } catch (err) {
        console.error('Error deleting team member:', err);
        alert('Failed to delete team member. Please try again.');
      }
    }
  };

  const handleAddSuccess = () => {
    refetchTeam();
  };

  const handleEditSuccess = () => {
    refetchTeam();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500';
      case 'In Meeting':
        return 'bg-amber-500';
      case 'Focus Time':
        return 'bg-red-500';
      case 'Away':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Calculate organization stats
  const departmentStats = teamMembers.reduce((acc, member) => {
    acc[member.department] = (acc[member.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalBudget = Object.keys(departmentStats).length * 600000; // Estimated budget per department

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Company Overview</h1>
        <p className="text-slate-600 mt-2">High-level metrics and organizational insights for MPB Health</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.id} data={kpi} />
        ))}
      </div>

      {/* Company Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Directory */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">Team Directory</h2>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-600">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{member.team}</p>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></div>
                      <span className="text-xs text-slate-600">{member.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit team member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete team member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <Building className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-900">Organization Structure</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(departmentStats).map(([dept, count]) => {
              const lead = teamMembers.find(m => m.department === dept && (m.role.includes('VP') || m.role.includes('Lead') || m.role.includes('Officer') || m.role.includes('Manager')))?.name || 'TBD';
              const budget = `$${(count * 120000).toLocaleString()}`;
              
              return (
                <div key={dept} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-slate-900">{dept}</h3>
                    <p className="text-sm text-slate-600">Led by {lead}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{count} team members</p>
                    <p className="text-sm text-slate-600">{budget} annual budget</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {[
            { time: '2 hours ago', event: 'API Gateway update deployed to production', type: 'deployment' },
            { time: '4 hours ago', event: 'Quarterly security audit completed', type: 'security' },
            { time: '6 hours ago', event: 'New team member onboarded to Frontend team', type: 'team' },
            { time: '1 day ago', event: 'Q3 2025 roadmap review meeting completed', type: 'planning' },
            { time: '2 days ago', event: 'HIPAA compliance training completed', type: 'compliance' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
              <div className={`w-3 h-3 rounded-full ${
                activity.type === 'deployment' ? 'bg-emerald-500' :
                activity.type === 'security' ? 'bg-amber-500' :
                activity.type === 'team' ? 'bg-blue-500' :
                activity.type === 'planning' ? 'bg-purple-500' : 'bg-red-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-slate-900">{activity.event}</p>
                <p className="text-xs text-slate-600">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Team Member Modal */}
      <EditTeamMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        member={selectedMember}
      />
    </div>
  );
}