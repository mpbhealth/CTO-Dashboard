import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  ChevronRight, 
  Clock, 
  FilePlus, 
  MessageSquare, 
  Plus, 
  Search, 
  Star, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Award,
  Calendar,
  FileText,
  RefreshCw,
  Filter,
  X,
  BarChart
} from 'lucide-react';
import { useEmployeeProfiles } from "../../hooks/useOrganizationalData";
import { 
  usePerformanceSystem,
  type PerformanceReview
} from '../../hooks/usePerformanceSystem';

export default function EmployeePerformance() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [reviewCycle, setReviewCycle] = useState('all');
  
  const { data: employees, loading: employeesLoading } = useEmployeeProfiles();
  
  // Get performance system hooks
  const {
    useEmployeeReviews,
    useEmployeeFeedback,
    useEmployeeKpis,
    useCareerDevelopmentPlans
  } = usePerformanceSystem();
  
  // Use the hooks with proper typing
  const { data: reviews = [], isLoading: reviewsLoading } = useEmployeeReviews(selectedEmployee || undefined);
  const { data: feedback = [], isLoading: feedbackLoading } = useEmployeeFeedback(selectedEmployee || undefined);
  const { data: kpiMeasurements = [], isLoading: kpiLoading } = useEmployeeKpis(selectedEmployee || undefined);
  const { data: careerPlans = [], isLoading: careerLoading } = useCareerDevelopmentPlans(selectedEmployee || undefined);
  
  // Create dummy data for missing features
  const goals: Array<{id: string; employee_id: string; status: string}> = [];
  const milestones: Array<{id: string; employee_id: string}> = [];
  const kpiDefinitions: Array<{id: string; name: string}> = [];
  
  const loading = employeesLoading || reviewsLoading || feedbackLoading || kpiLoading || careerLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           emp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  // Filter reviews by cycle if needed
  const filteredReviews = reviewCycle === 'all' 
    ? reviews 
    : reviews.filter(review => review.review_cycle === reviewCycle);

  // Get unique review cycles for filter
  const reviewCycles = ['all', ...Array.from(new Set(reviews.map(r => r.review_cycle)))];
  
  // Get employee feedback
  const employeeFeedback = selectedEmployee
    ? feedback.filter(f => f.recipient_id === selectedEmployee)
    : feedback;
  
  // Get employee KPIs
  const employeeKpis = selectedEmployee
    ? kpiMeasurements.filter(m => m.employee_id === selectedEmployee)
    : kpiMeasurements;
  
  // Get employee milestones
  const employeeMilestones = selectedEmployee
    ? milestones.filter(m => m.employee_id === selectedEmployee)
    : milestones;
  
  // Get employee goals
  const employeeGoals = selectedEmployee
    ? goals.filter(g => g.employee_id === selectedEmployee)
    : goals;

  // Get employee name by ID
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-pink-100 text-pink-800';
      case 'submitted':
        return 'bg-pink-100 text-pink-800';
      case 'under_review':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'acknowledged':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getKpiStatusColor = (status: string) => {
    switch (status) {
      case 'above_target':
        return 'text-emerald-500';
      case 'on_target':
        return 'text-pink-500';
      case 'below_target':
        return 'text-amber-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-slate-500';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'in_progress':
        return 'bg-pink-100 text-pink-800';
      case 'not_started':
        return 'bg-slate-100 text-slate-800';
      case 'deferred':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'promotion':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'certification':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'training':
        return <Briefcase className="w-4 h-4 text-pink-600" />;
      case 'award':
        return <Star className="w-4 h-4 text-amber-600" />;
      case 'salary_adjustment':
        return <BarChart className="w-4 h-4 text-pink-600" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-600" />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'reviews', label: 'Performance Reviews', icon: FileText },
    { id: 'kpi', label: 'KPI Tracking', icon: TrendingUp },
    { id: 'feedback', label: '360° Feedback', icon: MessageSquare },
    { id: 'career', label: 'Career Development', icon: Award }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employee Performance</h1>
          <p className="text-slate-600 mt-2">Evaluate, track, and develop your team's performance and career growth</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>New Review</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div 
          className="bg-white p-4 rounded-lg shadow border border-slate-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
              <select
                value={selectedEmployee || ''}
                onChange={(e) => setSelectedEmployee(e.target.value || null)}
                className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Review Cycle</label>
              <select
                value={reviewCycle}
                onChange={(e) => setReviewCycle(e.target.value)}
                className="w-full md:w-48 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500"
              >
                {reviewCycles.map(cycle => (
                  <option key={cycle} value={cycle}>
                    {cycle === 'all' ? 'All Cycles' : cycle}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setReviewCycle('all');
                setSearchTerm('');
              }}
              className="text-pink-600 hover:text-pink-800 text-sm font-medium md:self-end"
            >
              Reset Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {activeTab === 'dashboard' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Performance Dashboard</h2>
              <button
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Dashboard Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-500">Active Reviews</h3>
                  <FileText className="w-5 h-5 text-pink-500" />
                </div>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {reviews.filter(r => r.status !== 'approved' && r.status !== 'acknowledged').length}
                </p>
                <p className="text-sm text-slate-600">
                  {reviews.filter(r => r.status === 'draft').length} drafts, 
                  {reviews.filter(r => r.status === 'submitted').length} submitted
                </p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-500">KPIs Tracked</h3>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {kpiDefinitions.length}
                </p>
                <p className="text-sm text-slate-600">
                  {kpiMeasurements.length} measurements recorded
                </p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-500">Recent Feedback</h3>
                  <MessageSquare className="w-5 h-5 text-pink-500" />
                </div>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {feedback.filter(f => {
                    const date = new Date(f.created_at);
                    const now = new Date();
                    const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays <= 30;
                  }).length}
                </p>
                <p className="text-sm text-slate-600">
                  in the last 30 days
                </p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-500">Career Goals</h3>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {goals.filter(g => g.status === 'in_progress').length}
                </p>
                <p className="text-sm text-slate-600">
                  in progress, {goals.filter(g => g.status === 'completed').length} completed
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {/* Combine recent reviews, feedback, and milestones - show just a few */}
                {[...reviews, ...feedback, ...milestones]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((item, index) => {
                    // Determine item type and render accordingly
                    if ('review_cycle' in item) {
                      // It's a performance review
                      const review = item as PerformanceReview;
                      return (
                        <div key={`review-${index}`} className="flex items-start space-x-4 p-4 hover:bg-slate-50 rounded-lg transition-colors">
                          <div className="p-2 bg-pink-100 rounded-lg">
                            <FileText className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-slate-900">
                                {getEmployeeName(review.employee_id)} - {review.review_cycle} Review
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                                {review.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">
                              {review.status === 'draft' ? 'Started' : 
                               review.status === 'submitted' ? 'Submitted for review' : 
                               review.status === 'under_review' ? 'Under manager review' : 
                               review.status === 'approved' ? 'Approved by manager' : 'Acknowledged by employee'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(review.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    } else if ('feedback_type' in item) {
                      // It's feedback
                      const feedbackItem = item as typeof feedback[0];
                      return (
                        <div key={`feedback-${index}`} className="flex items-start space-x-4 p-4 hover:bg-slate-50 rounded-lg transition-colors">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-slate-900">
                                {feedbackItem.is_anonymous ? 'Anonymous' : 
                                 feedbackItem.provider ? `${feedbackItem.provider.first_name} ${feedbackItem.provider.last_name}` : 'Unknown'} 
                                provided feedback to {feedbackItem.recipient ? 
                                `${feedbackItem.recipient.first_name} ${feedbackItem.recipient.last_name}` : 'Unknown'}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                feedbackItem.feedback_type === 'praise' ? 'bg-emerald-100 text-emerald-800' :
                                feedbackItem.feedback_type === 'concern' ? 'bg-amber-100 text-amber-800' :
                                feedbackItem.feedback_type === 'suggestion' ? 'bg-pink-100 text-pink-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {feedbackItem.feedback_type}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {feedbackItem.content}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(feedbackItem.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      // It's a career milestone
                      const milestone = item as typeof milestones[0];
                      return (
                        <div key={`milestone-${index}`} className="flex items-start space-x-4 p-4 hover:bg-slate-50 rounded-lg transition-colors">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Award className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-slate-900">
                                {getEmployeeName(milestone.employee_id)} - {milestone.title}
                              </h4>
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                {milestone.milestone_type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {milestone.description || milestone.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(milestone.achievement_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })}
              </div>
            </div>

            {/* Team Performance Summary */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Team Performance Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Latest Review
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Current KPIs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Goals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredEmployees.slice(0, 5).map((employee) => {
                      const latestReview = reviews.find(r => r.employee_id === employee.id);
                      const employeeKpis = kpiMeasurements.filter(k => k.employee_id === employee.id);
                      const employeeGoals = goals.filter(g => g.employee_id === employee.id);
                      
                      return (
                        <tr key={employee.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-pink-600">
                                  {employee.first_name[0]}{employee.last_name[0]}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">
                                  {employee.first_name} {employee.last_name}
                                </div>
                                <div className="text-sm text-slate-500">{employee.title}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {latestReview ? (
                              <div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(latestReview.status)}`}>
                                  {latestReview.status.replace('_', ' ')}
                                </span>
                                <div className="text-xs text-slate-500 mt-1">{latestReview.review_cycle}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">No reviews</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {employeeKpis.length > 0 ? (
                              <div>
                                <div className="font-medium text-slate-900">{employeeKpis.length} KPIs</div>
                                <div className="flex space-x-1 mt-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">No KPIs assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {employeeGoals.length > 0 ? (
                              <div>
                                <div className="font-medium text-slate-900">
                                  {employeeGoals.filter(g => g.status === 'completed').length} / {employeeGoals.length} complete
                                </div>
                                <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-2">
                                  <div 
                                    className="bg-pink-600 h-1.5 rounded-full" 
                                    style={{ 
                                      width: `${Math.round((employeeGoals.filter(g => g.status === 'completed').length / employeeGoals.length) * 100)}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">No goals set</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button 
                                className="text-pink-600 hover:text-pink-900"
                                onClick={() => {
                                  setSelectedEmployee(employee.id);
                                  setActiveTab('reviews');
                                }}
                              >
                                View
                              </button>
                              <button className="text-emerald-600 hover:text-emerald-900">
                                New Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedEmployee 
                  ? `Performance Reviews for ${getEmployeeName(selectedEmployee)}` 
                  : 'All Performance Reviews'}
              </h2>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors">
                <FilePlus className="w-4 h-4" />
                <span>New Review</span>
              </button>
            </div>

            {filteredReviews.length > 0 ? (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-slate-900">
                            {getEmployeeName(review.employee_id)}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                            {review.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          {review.review_cycle} Review • {new Date(review.period_start).toLocaleDateString()} to {new Date(review.period_end).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {review.overall_score && (
                          <div className="flex items-center space-x-1">
                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                              <span className="font-semibold text-pink-600">{review.overall_score}</span>
                            </div>
                            <span className="text-sm text-slate-600">/5</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {review.performance_summary && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 line-clamp-3">{review.performance_summary}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(review.updated_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>Reviewer: {getEmployeeName(review.reviewer_id)}</span>
                        </div>
                      </div>
                      
                      <button className="flex items-center space-x-1 text-pink-600 hover:text-pink-800 text-sm font-medium">
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No reviews found</h3>
                <p className="text-slate-600 mt-2 mb-6">
                  {selectedEmployee
                    ? "This employee doesn't have any performance reviews yet."
                    : "No performance reviews found with the current filter settings."}
                </p>
                <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors">
                  <FilePlus className="w-4 h-4" />
                  <span>Create New Review</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'kpi' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedEmployee 
                  ? `KPI Dashboard for ${getEmployeeName(selectedEmployee)}` 
                  : 'Team KPI Dashboard'}
              </h2>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add KPI</span>
                </button>
              </div>
            </div>

            {employeeKpis.length > 0 ? (
              <div className="space-y-6">
                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-emerald-800">Above Target</h3>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">
                      {employeeKpis.filter(k => k.status === 'above_target').length}
                    </p>
                    <p className="text-sm text-emerald-700">KPIs exceeding expectations</p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-amber-800">At Risk</h3>
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-900">
                      {employeeKpis.filter(k => k.status === 'below_target').length}
                    </p>
                    <p className="text-sm text-amber-700">KPIs below target level</p>
                  </div>

                  <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-pink-800">Total KPIs</h3>
                      <BarChart className="w-5 h-5 text-pink-600" />
                    </div>
                    <p className="text-2xl font-bold text-pink-900">
                      {employeeKpis.length}
                    </p>
                    <p className="text-sm text-pink-700">Active KPI measurements</p>
                  </div>
                </div>

                {/* KPI Table */}
                <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">KPI Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Target</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {employeeKpis.map((kpi) => (
                        <tr key={kpi.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {kpi.kpi?.name || 'Unknown KPI'}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {kpi.kpi?.description?.substring(0, 50) || 'No description'}
                              {kpi.kpi?.description && kpi.kpi.description.length > 50 ? '...' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {kpi.value} {kpi.kpi?.measurement_unit || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {kpi.kpi?.target_value || 'N/A'} {kpi.kpi?.measurement_unit || ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center space-x-1 ${getKpiStatusColor(kpi.status || 'on_target')}`}>
                              {kpi.status === 'above_target' ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : kpi.status === 'below_target' || kpi.status === 'critical' ? (
                                <TrendingDown className="w-4 h-4" />
                              ) : (
                                <Target className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                {kpi.status?.replace('_', ' ') || 'On Target'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(kpi.measurement_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => alert('KPI details: ' + kpi.name)}
                              className="text-pink-600 hover:text-pink-900 underline"
                              title={`View details for ${kpi.name}`}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No KPIs found</h3>
                <p className="text-slate-600 mt-2 mb-6">
                  {selectedEmployee
                    ? "This employee doesn't have any KPIs tracked yet."
                    : "No KPIs have been defined for your team yet."}
                </p>
                <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Define New KPI</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedEmployee 
                  ? `Feedback for ${getEmployeeName(selectedEmployee)}` 
                  : '360° Feedback System'}
              </h2>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>Provide Feedback</span>
              </button>
            </div>

            {employeeFeedback.length > 0 ? (
              <div className="space-y-6">
                {/* Feedback Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-emerald-600 mb-1">Praise</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {employeeFeedback.filter(f => f.feedback_type === 'praise').length}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-amber-600 mb-1">Concerns</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {employeeFeedback.filter(f => f.feedback_type === 'concern').length}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-pink-600 mb-1">Suggestions</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {employeeFeedback.filter(f => f.feedback_type === 'suggestion').length}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-slate-600 mb-1">Anonymous</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {employeeFeedback.filter(f => f.is_anonymous).length}
                    </div>
                  </div>
                </div>

                {/* Feedback List */}
                <div className="space-y-4">
                  {employeeFeedback.map((feedback) => (
                    <div key={feedback.id} className="p-6 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              feedback.feedback_type === 'praise' ? 'bg-emerald-100 text-emerald-800' :
                              feedback.feedback_type === 'concern' ? 'bg-amber-100 text-amber-800' :
                              feedback.feedback_type === 'suggestion' ? 'bg-pink-100 text-pink-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {feedback.feedback_type.charAt(0).toUpperCase() + feedback.feedback_type.slice(1)}
                            </span>
                            
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              feedback.visibility === 'public' ? 'bg-pink-100 text-pink-800' :
                              feedback.visibility === 'private' ? 'bg-purple-100 text-purple-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {feedback.visibility.charAt(0).toUpperCase() + feedback.visibility.slice(1)}
                            </span>
                            
                            {feedback.is_anonymous && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
                                Anonymous
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center space-x-2">
                            <div className="text-sm font-medium text-slate-900">
                              {feedback.is_anonymous 
                                ? 'Anonymous' 
                                : feedback.provider 
                                  ? `${feedback.provider.first_name} ${feedback.provider.last_name}`
                                  : 'Unknown'}
                            </div>
                            <div className="text-slate-400">→</div>
                            <div className="text-sm font-medium text-slate-900">
                              {feedback.recipient 
                                ? `${feedback.recipient.first_name} ${feedback.recipient.last_name}`
                                : 'Unknown'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-slate-500">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-slate-600">{feedback.content}</p>
                      </div>
                      
                      {feedback.category && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <span className="text-slate-500">Category:</span>
                              <span className="ml-1 font-medium text-slate-700">{feedback.category}</span>
                            </div>
                            
                            {feedback.related_project && (
                              <div>
                                <span className="text-slate-500">Project:</span>
                                <span className="ml-1 font-medium text-slate-700">{feedback.related_project}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No feedback found</h3>
                <p className="text-slate-600 mt-2 mb-6">
                  {selectedEmployee
                    ? "This employee hasn't received any feedback yet."
                    : "No feedback has been recorded in the system yet."}
                </p>
                <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span>Provide Feedback</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'career' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedEmployee 
                  ? `Career Development for ${getEmployeeName(selectedEmployee)}` 
                  : 'Career Development Hub'}
              </h2>
              
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add Milestone</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Create Goal</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Career Timeline */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Career Development Timeline</h3>
                {employeeMilestones.length > 0 ? (
                  <div className="relative pl-8 pb-4">
                    {/* Timeline Line */}
                    <div className="absolute top-0 bottom-0 left-4 w-px bg-pink-200"></div>
                    
                    {/* Timeline Events */}
                    <div className="space-y-8">
                      {employeeMilestones.map((milestone) => (
                        <div key={milestone.id} className="relative">
                          {/* Timeline Dot */}
                          <div className="absolute -left-8 mt-1.5 w-8 h-8 bg-pink-100 border-4 border-white shadow rounded-full flex items-center justify-center z-10">
                            {getMilestoneIcon(milestone.milestone_type)}
                          </div>
                          
                          <div className="bg-white p-5 rounded-lg border border-slate-200 hover:shadow-md transition-shadow ml-3">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-slate-900">{milestone.title}</h4>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                    {milestone.milestone_type.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">
                                  {getEmployeeName(milestone.employee_id)}
                                </p>
                              </div>
                              
                              <div className="text-sm text-slate-500">
                                {new Date(milestone.achievement_date).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {milestone.description && (
                              <div className="mt-3 text-slate-600 text-sm">{milestone.description}</div>
                            )}
                            
                            {milestone.related_skills && milestone.related_skills.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {milestone.related_skills.map((skill, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No career milestones recorded yet</p>
                  </div>
                )}
              </div>
              
              {/* Current Goals */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Current Goals</h3>
                
                {employeeGoals.length > 0 ? (
                  <div className="space-y-4 bg-white">
                    {employeeGoals.map((goal) => (
                      <div key={goal.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-slate-900">{goal.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGoalStatusColor(goal.status)}`}>
                                {goal.status.replace('_', ' ')}
                              </span>
                            </div>
                            
                            {goal.description && (
                              <p className="text-sm text-slate-600 mt-1">{goal.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            {goal.goal_type && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                {goal.goal_type}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1 text-xs">
                            <span className="text-slate-600">Progress</span>
                            <span className="font-medium text-slate-900">{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                goal.status === 'completed' ? 'bg-emerald-500' : 
                                goal.progress > 75 ? 'bg-emerald-500' : 
                                goal.progress > 25 ? 'bg-pink-500' : 
                                'bg-amber-500'
                              }`}
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <div className="text-slate-500">
                            {goal.due_date ? `Due: ${new Date(goal.due_date).toLocaleDateString()}` : 'No due date'}
                          </div>
                          <button className="text-pink-600 hover:text-pink-800 font-medium">
                            Update
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No performance goals set yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
