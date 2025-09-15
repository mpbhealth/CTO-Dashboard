import React, { useState } from 'react';
import { 
  Award, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Edit, 
  FileText, 
  Plus, 
  Search,
  User, 
  Users,
  TrendingUp,
  MessageSquare,
  Send,
  X
} from 'lucide-react';
import { useEmployeeProfiles } from "../../hooks/useOrganizationalData";
import { usePerformanceSystem, PerformanceReview } from '../../hooks/usePerformanceSystem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

// Wrap the component with QueryClientProvider
export default function PerformanceEvaluationWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <PerformanceEvaluation />
    </QueryClientProvider>
  );
}

function PerformanceEvaluation() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'reviews' | 'kpis' | 'development' | 'feedback'>('reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    feedback_type: 'praise' as 'praise' | 'criticism' | 'suggestion' | 'question',
    content: '',
    is_anonymous: false
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const { data: employees, loading: employeesLoading } = useEmployeeProfiles();
  const { useEmployeeReviews, useEmployeeKpis, useCareerDevelopmentPlans, useEmployeeFeedback, useProvideFeedback } = usePerformanceSystem();

  // Fetch data based on selected employee
  const { 
    data: reviews, 
    isLoading: reviewsLoading, 
    error: reviewsError 
  } = useEmployeeReviews(selectedEmployee || undefined);
  
  const { 
    data: kpis, 
    isLoading: kpisLoading 
  } = useEmployeeKpis(selectedEmployee || undefined);
  
  const { 
    data: careerPlans, 
    isLoading: plansLoading 
  } = useCareerDevelopmentPlans(selectedEmployee || undefined);
  
  const { 
    data: feedback, 
    isLoading: feedbackLoading 
  } = useEmployeeFeedback(selectedEmployee || undefined);

  const provideFeedbackMutation = useProvideFeedback();

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter employees based on search term
  const filteredEmployees = employees?.filter(emp => 
    (emp.first_name + ' ' + emp.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected employee details
  const selectedEmployeeDetails = employees?.find(emp => emp.id === selectedEmployee);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'acknowledged':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Get KPI status color
  const getKpiStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'off_track':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const openFeedbackModal = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setIsFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !feedbackForm.content.trim()) return;

    setIsSubmittingFeedback(true);
    
    try {
      await provideFeedbackMutation.mutateAsync({
        recipient_id: selectedEmployee,
        provider_id: feedbackForm.is_anonymous ? null : 'current-user-id', // In real app, get current user ID
        feedback_type: feedbackForm.feedback_type,
        content: feedbackForm.content.trim(),
        is_anonymous: feedbackForm.is_anonymous
      });

      // Reset form and close modal
      setFeedbackForm({
        feedback_type: 'praise',
        content: '',
        is_anonymous: false
      });
      setIsFeedbackModalOpen(false);
      
      alert('Feedback submitted successfully!');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleFeedbackInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFeedbackForm(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFeedbackForm(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Employee Performance</h1>
        <p className="text-slate-600 mt-2">Evaluate, track and develop employee performance</p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-4 gap-6">
        {/* Employee List */}
        <div className="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[calc(100vh-220px)] overflow-y-auto">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredEmployees?.map((employee) => (
              <div
                key={employee.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedEmployee === employee.id
                    ? 'bg-indigo-50 border-indigo-200 border'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
                onClick={() => setSelectedEmployee(employee.id)}
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">
                    {employee.first_name[0]}{employee.last_name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-sm text-slate-600 truncate">{employee.title}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFeedbackModal(employee.id);
                    }}
                    className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Give Feedback
                  </button>
                </div>
              </div>
            ))}

            {filteredEmployees?.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No employees found</p>
              </div>
            )}
          </div>
        </div>

        {/* Employee Details & Performance Data */}
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 h-[calc(100vh-220px)] overflow-y-auto">
          {selectedEmployee ? (
            <div>
              {/* Employee Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-medium text-indigo-600">
                        {selectedEmployeeDetails?.first_name}{selectedEmployeeDetails?.last_name}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedEmployeeDetails?.first_name} {selectedEmployeeDetails?.last_name}
                      </h2>
                      <p className="text-slate-600">{selectedEmployeeDetails?.title}</p>
                    </div>
                  </div>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>New Review</span>
                  </button>
                  <button
                    onClick={() => openFeedbackModal(selectedEmployee)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Give Feedback</span>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center border-b border-slate-200">
                <button
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                    selectedTab === 'reviews'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedTab('reviews')}
                >
                  <FileText className="w-4 h-4" />
                  <span>Performance Reviews</span>
                </button>
                <button
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                    selectedTab === 'kpis'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedTab('kpis')}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>KPIs</span>
                </button>
                <button
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                    selectedTab === 'development'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedTab('development')}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Career Development</span>
                </button>
                <button
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                    selectedTab === 'feedback'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedTab('feedback')}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Feedback</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {selectedTab === 'reviews' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Performance Reviews</h3>
                    </div>
                    
                    {reviewsLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : reviews && reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review: PerformanceReview) => (
                          <div 
                            key={review.id} 
                            className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-700 font-medium">
                                  {review.review_cycle.charAt(0).toUpperCase() + review.review_cycle.slice(1)} Review
                                </span>
                                <span className="text-slate-500">
                                  {formatDate(review.period_start)} - {formatDate(review.period_end)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                                  {review.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                                <button className="p-1 hover:bg-slate-100 rounded">
                                  <Edit className="w-4 h-4 text-slate-500" />
                                </button>
                              </div>
                            </div>
                            
                            {review.overall_score && (
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Award className="w-4 h-4 text-amber-500" />
                                  <span className="text-slate-700 font-medium">Score: {review.overall_score}</span>
                                </div>
                                {review.final_rating && (
                                  <span className="text-slate-700">
                                    Rating: {review.final_rating.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {review.performance_summary && (
                              <div className="mt-3 text-sm text-slate-700">
                                {review.performance_summary.length > 200 
                                  ? review.performance_summary.substring(0, 200) + '...'
                                  : review.performance_summary
                                }
                              </div>
                            )}
                            
                            <div className="mt-3 flex justify-end">
                              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                View Complete Review
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-slate-700 mb-2">No reviews yet</h4>
                        <p className="text-slate-500 mb-4">Start by creating the first performance review</p>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors mx-auto">
                          <Plus className="w-4 h-4" />
                          <span>Create Review</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'kpis' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Key Performance Indicators</h3>
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Add KPI</span>
                      </button>
                    </div>
                    
                    {kpisLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : kpis && kpis.length > 0 ? (
                      <div className="space-y-4">
                        {kpis.map((kpi: any) => (
                          <div 
                            key={kpi.id} 
                            className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center space-x-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                <span className="text-slate-900 font-medium">{kpi.kpi?.name || 'KPI'}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKpiStatusColor(kpi.status)}`}>
                                {kpi.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-500">Progress</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-slate-700">{kpi.current_value}</span>
                                  <span className="text-xs text-slate-500">/ {kpi.kpi?.target_value || 'target'}</span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    kpi.status === 'on_track' ? 'bg-green-500' :
                                    kpi.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (kpi.current_value / (kpi.kpi?.target_value || 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="mt-3 text-sm text-slate-600">
                              Last updated: {new Date(kpi.last_updated).toLocaleDateString()}
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                Update
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-slate-700 mb-2">No KPIs assigned</h4>
                        <p className="text-slate-500 mb-4">Assign KPIs to track employee performance</p>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors mx-auto">
                          <Plus className="w-4 h-4" />
                          <span>Assign KPIs</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'development' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Career Development</h3>
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>New Plan</span>
                      </button>
                    </div>
                    
                    {plansLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : careerPlans && careerPlans.length > 0 ? (
                      <div className="space-y-4">
                        {careerPlans.map((plan: any) => (
                          <div 
                            key={plan.id} 
                            className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-slate-900 font-medium">{plan.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                                plan.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-3">{plan.description}</p>
                            
                            <div className="flex items-center space-x-8 mb-3 text-sm">
                              <div>
                                <span className="text-slate-500">Started:</span>
                                <span className="ml-1 text-slate-700">{formatDate(plan.start_date)}</span>
                              </div>
                              
                              {plan.target_completion_date && (
                                <div>
                                  <span className="text-slate-500">Target:</span>
                                  <span className="ml-1 text-slate-700">{formatDate(plan.target_completion_date)}</span>
                                </div>
                              )}
                              
                              {plan.mentor_id && (
                                <div>
                                  <span className="text-slate-500">Mentor:</span>
                                  <span className="ml-1 text-slate-700">Mentor Name</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-500">Progress</span>
                                <span className="text-sm font-medium text-slate-700">{plan.progress}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600"
                                  style={{ width: `${plan.progress}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end space-x-3">
                              <button className="text-slate-600 hover:text-slate-800 text-sm font-medium">
                                View Activities
                              </button>
                              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                Update Plan
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-slate-700 mb-2">No career plans</h4>
                        <p className="text-slate-500 mb-4">Create a development plan to track career growth</p>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors mx-auto">
                          <Plus className="w-4 h-4" />
                          <span>Create Plan</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'feedback' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">360° Feedback</h3>
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Provide Feedback</span>
                      </button>
                    </div>
                    
                    {feedbackLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : feedback && feedback.length > 0 ? (
                      <div className="space-y-4">
                        {feedback.map((item: any) => (
                          <div 
                            key={item.id} 
                            className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  item.feedback_type === 'praise' ? 'bg-green-100' :
                                  item.feedback_type === 'criticism' ? 'bg-red-100' :
                                  item.feedback_type === 'suggestion' ? 'bg-blue-100' : 'bg-purple-100'
                                }`}>
                                  <MessageSquare className={`w-4 h-4 ${
                                    item.feedback_type === 'praise' ? 'text-green-600' :
                                    item.feedback_type === 'criticism' ? 'text-red-600' :
                                    item.feedback_type === 'suggestion' ? 'text-blue-600' : 'text-purple-600'
                                  }`} />
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <p className="font-medium text-slate-900">
                                      {item.feedback_type.charAt(0).toUpperCase() + item.feedback_type.slice(1)}
                                    </p>
                                    {item.is_anonymous ? (
                                      <span className="ml-2 text-xs text-slate-500">(Anonymous)</span>
                                    ) : (
                                      <span className="ml-2 text-xs text-slate-500">
                                        from {item.provider ? `${item.provider.first_name} ${item.provider.last_name}` : 'Unknown'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-700 mt-1">{item.content}</p>
                                </div>
                              </div>
                              <span className="text-xs text-slate-500">
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-slate-700 mb-2">No feedback yet</h4>
                        <p className="text-slate-500 mb-4">Collect feedback to help improve performance</p>
                        <button
                          onClick={() => openFeedbackModal(selectedEmployee)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Provide Feedback</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-4 py-12">
                <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Select an Employee</h3>
                <p className="text-slate-600 mb-6">Choose an employee from the list to view their performance data and evaluations.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Provide Feedback for {selectedEmployeeDetails?.first_name} {selectedEmployeeDetails?.last_name}
                </h2>
              </div>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-6">
              <div>
                <label htmlFor="feedback_type" className="block text-sm font-medium text-slate-700 mb-2">
                  Feedback Type
                </label>
                <select
                  id="feedback_type"
                  name="feedback_type"
                  value={feedbackForm.feedback_type}
                  onChange={handleFeedbackInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="praise">👏 Praise</option>
                  <option value="suggestion">💡 Suggestion</option>
                  <option value="criticism">🔧 Constructive Criticism</option>
                  <option value="question">❓ Question</r
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-2">
                  Feedback Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={6}
                  value={feedbackForm.content}
                  onChange={handleFeedbackInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Share your feedback here..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_anonymous"
                  name="is_anonymous"
                  checked={feedbackForm.is_anonymous}
                  onChange={handleFeedbackInputChange}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_anonymous" className="text-sm text-slate-700">
                  Submit anonymously
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={isSubmittingFeedback}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackForm.content.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
