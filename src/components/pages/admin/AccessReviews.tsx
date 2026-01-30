/**
 * Access Reviews
 * 
 * Quarterly access review system for SOC 2 Type II compliance.
 * Enables role assignment auditing, least privilege verification, and attestation.
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  UserCheck,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit2,
  History,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { logAdminAction } from '../../../lib/auditService';

// Types
interface AccessReview {
  id: string;
  review_period: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  created_at: string;
  due_date: string;
  completed_at?: string;
  completed_by?: string;
  total_users: number;
  reviewed_users: number;
  changes_made: number;
  attestation_signature?: string;
  notes?: string;
}

interface UserAccess {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  last_login?: string;
  status: 'active' | 'inactive' | 'suspended';
  review_status: 'pending' | 'approved' | 'modified' | 'revoked';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

// Demo data
const demoReviews: AccessReview[] = [
  {
    id: '1',
    review_period: 'Q1 2026',
    status: 'in_progress',
    created_at: '2026-01-01T00:00:00Z',
    due_date: '2026-01-31T23:59:59Z',
    total_users: 25,
    reviewed_users: 18,
    changes_made: 3,
  },
  {
    id: '2',
    review_period: 'Q4 2025',
    status: 'completed',
    created_at: '2025-10-01T00:00:00Z',
    due_date: '2025-10-31T23:59:59Z',
    completed_at: '2025-10-28T14:30:00Z',
    completed_by: 'John Smith',
    total_users: 23,
    reviewed_users: 23,
    changes_made: 5,
    attestation_signature: 'John Smith - Security Officer',
    notes: 'All access verified. Removed 2 inactive accounts, modified 3 role assignments.',
  },
  {
    id: '3',
    review_period: 'Q3 2025',
    status: 'completed',
    created_at: '2025-07-01T00:00:00Z',
    due_date: '2025-07-31T23:59:59Z',
    completed_at: '2025-07-25T10:15:00Z',
    completed_by: 'Jane Doe',
    total_users: 21,
    reviewed_users: 21,
    changes_made: 2,
    attestation_signature: 'Jane Doe - HIPAA Officer',
  },
];

const demoUsers: UserAccess[] = [
  { id: '1', user_id: 'u1', email: 'admin@mpbhealth.com', full_name: 'Admin User', role: 'admin', last_login: '2026-01-30T09:00:00Z', status: 'active', review_status: 'approved', reviewed_by: 'John Smith', reviewed_at: '2026-01-15T10:00:00Z' },
  { id: '2', user_id: 'u2', email: 'ceo@mpbhealth.com', full_name: 'CEO User', role: 'ceo', last_login: '2026-01-30T08:30:00Z', status: 'active', review_status: 'approved', reviewed_by: 'John Smith', reviewed_at: '2026-01-15T10:05:00Z' },
  { id: '3', user_id: 'u3', email: 'cto@mpbhealth.com', full_name: 'CTO User', role: 'cto', last_login: '2026-01-29T16:45:00Z', status: 'active', review_status: 'pending' },
  { id: '4', user_id: 'u4', email: 'hipaa.officer@mpbhealth.com', full_name: 'HIPAA Officer', role: 'hipaa_officer', last_login: '2026-01-28T14:20:00Z', status: 'active', review_status: 'pending' },
  { id: '5', user_id: 'u5', email: 'staff1@mpbhealth.com', full_name: 'Staff Member 1', role: 'staff', last_login: '2026-01-25T11:30:00Z', status: 'active', review_status: 'pending' },
  { id: '6', user_id: 'u6', email: 'staff2@mpbhealth.com', full_name: 'Staff Member 2', role: 'staff', last_login: '2025-12-15T09:00:00Z', status: 'inactive', review_status: 'pending' },
  { id: '7', user_id: 'u7', email: 'contractor@mpbhealth.com', full_name: 'Contractor', role: 'staff', last_login: '2025-11-01T10:00:00Z', status: 'suspended', review_status: 'revoked', reviewed_by: 'John Smith', reviewed_at: '2026-01-16T09:00:00Z', review_notes: 'Contract ended' },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  ceo: 'CEO',
  cto: 'CTO',
  cfo: 'CFO',
  hipaa_officer: 'HIPAA Officer',
  privacy_officer: 'Privacy Officer',
  security_officer: 'Security Officer',
  manager: 'Manager',
  staff: 'Staff',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const reviewStatusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  modified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  revoked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function AccessReviews() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<AccessReview | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showAttestation, setShowAttestation] = useState(false);
  const [attestationNotes, setAttestationNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // In production, fetch from database
    if (!isSupabaseConfigured) {
      setReviews(demoReviews);
      setUsers(demoUsers);
      setActiveReview(demoReviews[0]);
      setLoading(false);
      return;
    }

    try {
      // Fetch access reviews
      const { data: reviewData } = await supabase
        .from('access_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewData) {
        setReviews(reviewData);
        const current = reviewData.find(r => r.status === 'in_progress') || reviewData[0];
        setActiveReview(current || null);
      }

      // Fetch user access data
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (userData) {
        // Transform to UserAccess format
        const accessUsers: UserAccess[] = userData.map(u => ({
          id: u.id,
          user_id: u.user_id,
          email: u.email,
          full_name: u.full_name || u.email,
          role: u.role || 'staff',
          last_login: u.last_login_at,
          status: 'active',
          review_status: 'pending',
        }));
        setUsers(accessUsers);
      }
    } catch (error) {
      console.error('Error loading access review data:', error);
      // Fall back to demo data
      setReviews(demoReviews);
      setUsers(demoUsers);
      setActiveReview(demoReviews[0]);
    }

    setLoading(false);
  };

  const handleReviewUser = async (userId: string, status: 'approved' | 'modified' | 'revoked', notes?: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? {
              ...u,
              review_status: status,
              reviewed_by: profile?.full_name || profile?.email,
              reviewed_at: new Date().toISOString(),
              review_notes: notes,
            }
          : u
      )
    );

    // Log the action
    await logAdminAction(
      `Access review: User ${status}`,
      'user',
      userId,
      { status, notes, review_id: activeReview?.id }
    );
  };

  const handleCompleteReview = async () => {
    if (!activeReview) return;

    const pendingCount = users.filter(u => u.review_status === 'pending').length;
    if (pendingCount > 0) {
      alert(`Cannot complete review. ${pendingCount} users still pending review.`);
      return;
    }

    setShowAttestation(true);
  };

  const submitAttestation = async () => {
    if (!activeReview || !profile) return;

    const completedReview: AccessReview = {
      ...activeReview,
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: profile.full_name || profile.email,
      reviewed_users: users.length,
      changes_made: users.filter(u => u.review_status !== 'approved').length,
      attestation_signature: `${profile.full_name || profile.email} - ${profile.role?.toUpperCase() || 'Reviewer'}`,
      notes: attestationNotes,
    };

    setReviews(prev =>
      prev.map(r => (r.id === activeReview.id ? completedReview : r))
    );
    setActiveReview(completedReview);
    setShowAttestation(false);
    setAttestationNotes('');

    // Log the attestation
    await logAdminAction(
      'Access review completed with attestation',
      'audit_log',
      activeReview.id,
      {
        review_period: activeReview.review_period,
        total_users: users.length,
        changes_made: users.filter(u => u.review_status !== 'approved').length,
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-blue-500" />
            Access Reviews
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quarterly user access audits for SOC 2 compliance
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Review History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-gray-500" />
          Review History
        </h2>
        <div className="space-y-3">
          {reviews.map(review => (
            <div
              key={review.id}
              onClick={() => setActiveReview(review)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                activeReview?.id === review.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {review.review_period}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[review.status]}`}>
                    {review.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {review.reviewed_users}/{review.total_users} reviewed
                </div>
              </div>
              {review.status === 'completed' && review.attestation_signature && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-green-500" />
                  Attested by: {review.attestation_signature}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Review */}
      {activeReview && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              {activeReview.review_period} Review
            </h2>
            {activeReview.status === 'in_progress' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Due: {formatDate(activeReview.due_date)}
                  {getDaysUntilDue(activeReview.due_date) <= 7 && (
                    <span className="ml-2 text-yellow-500">
                      ({getDaysUntilDue(activeReview.due_date)} days left)
                    </span>
                  )}
                </span>
                <button
                  onClick={handleCompleteReview}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Review
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">Review Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.review_status !== 'pending').length}/{users.length}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${(users.filter(u => u.review_status !== 'pending').length / users.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2">
            {users.map(user => (
              <div
                key={user.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <div
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : user.status === 'inactive'
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {roleLabels[user.role] || user.role}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${reviewStatusColors[user.review_status]}`}>
                      {user.review_status.toUpperCase()}
                    </span>
                    {expandedUser === user.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedUser === user.id && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Last Login:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {user.last_login ? formatDate(user.last_login) : 'Never'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <span className="ml-2 text-gray-900 dark:text-white capitalize">
                          {user.status}
                        </span>
                      </div>
                      {user.reviewed_by && (
                        <>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Reviewed By:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {user.reviewed_by}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Reviewed At:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {user.reviewed_at && formatDate(user.reviewed_at)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    {user.review_notes && (
                      <div className="py-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Notes:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{user.review_notes}</span>
                      </div>
                    )}

                    {activeReview.status === 'in_progress' && user.review_status === 'pending' && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleReviewUser(user.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewUser(user.id, 'modified', 'Role modified')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Modify
                        </button>
                        <button
                          onClick={() => handleReviewUser(user.id, 'revoked', 'Access revoked')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Revoke
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attestation Modal */}
      {showAttestation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-green-500" />
              Complete Access Review
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              By completing this review, you attest that all user access has been verified
              and is appropriate for their role and responsibilities.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={attestationNotes}
                onChange={(e) => setAttestationNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about this review..."
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>Total Users Reviewed: {users.length}</div>
                <div>Changes Made: {users.filter(u => u.review_status !== 'approved').length}</div>
                <div>Attesting As: {profile?.full_name || profile?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAttestation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitAttestation}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Sign & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccessReviews;
