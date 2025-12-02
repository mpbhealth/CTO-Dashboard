import React, { useState } from 'react';
import { Plus, Users, BookOpen, Award, Download } from 'lucide-react';
import { useTrainings, useTrainingAttendance } from '../../hooks/useComplianceData';
import { ImporterModal } from '../compliance/ImporterModal';
import { supabase } from '../../lib/supabase';

const ComplianceTraining: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  
  const { data: trainings = [], isLoading } = useTrainings();
  const { data: attendance = [] } = useTrainingAttendance(selectedTraining || undefined);

  const handleImportAttendance = async (data: any[]) => {
    try {
      const importData = data.map(row => ({
        training_id: selectedTraining,
        user_email: row.user_email || row.email,
        user_name: row.user_name || row.name,
        completed_at: row.completed_at || new Date().toISOString(),
        score: row.score ? parseFloat(row.score) : null,
      }));

      const { error } = await supabase
        .from('hipaa_training_attendance')
        .insert(importData);

      if (error) throw error;

      return {
        success: importData.length,
        errors: [],
      };
    } catch (error: any) {
      return {
        success: 0,
        errors: [{ row: 0, message: error.message }],
      };
    }
  };

  const calculateCompletionRate = (trainingId: string) => {
    const trainingAttendance = attendance.filter(a => a.training_id === trainingId);
    const completed = trainingAttendance.filter(a => a.completed_at).length;
    return trainingAttendance.length > 0 
      ? Math.round((completed / trainingAttendance.length) * 100)
      : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-8 h-8 text-indigo-600" />
            <span>Training & Awareness</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage HIPAA training programs and track employee completion
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Download className="w-5 h-5" />
          <span>Import Attendance</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600">Training Programs</p>
          <p className="text-2xl font-bold text-gray-900">{trainings.length}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg border-2 border-indigo-200 p-4">
          <p className="text-sm text-gray-600">Required Trainings</p>
          <p className="text-2xl font-bold text-indigo-800">
            {trainings.filter(t => t.is_required).length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
          <p className="text-sm text-gray-600">Total Completions</p>
          <p className="text-2xl font-bold text-green-800">
            {attendance.filter(a => a.completed_at).length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">
            {attendance.filter(a => !a.completed_at).length}
          </p>
        </div>
      </div>

      {/* Training Programs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Programs</h2>
        <div className="space-y-4">
          {trainings.map((training) => {
            const completionRate = calculateCompletionRate(training.id);
            return (
              <div
                key={training.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">{training.name}</h3>
                      {training.is_required && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{training.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTraining(training.id)}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Frequency</p>
                    <p className="font-medium text-gray-900 capitalize">{training.frequency}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">
                      {training.duration_minutes ? `${training.duration_minutes} min` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completion Rate</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900">{completionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {trainings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No training programs found</p>
              <p className="text-sm">Training programs will be loaded from the database</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Completions */}
      {attendance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Completions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Training
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Certificate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.slice(0, 10).map((record) => {
                  const training = trainings.find(t => t.id === record.training_id);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{record.user_name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{record.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {training?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {record.completed_at 
                          ? new Date(record.completed_at).toLocaleDateString()
                          : 'Not completed'
                        }
                      </td>
                      <td className="px-6 py-4">
                        {record.score ? (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            record.score >= 80 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.certificate_url ? (
                          <a
                            href={record.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700"
                          >
                            <Award className="w-4 h-4" />
                            <span className="text-sm">View</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImporterModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import Training Attendance"
          columnMappings={[
            { sourceColumn: 'user_email', targetField: 'user_email', required: true },
            { sourceColumn: 'user_name', targetField: 'user_name', required: false },
            { sourceColumn: 'completed_at', targetField: 'completed_at', required: false },
            { sourceColumn: 'score', targetField: 'score', required: false },
          ]}
          onImport={handleImportAttendance}
          templateData={[
            {
              user_email: 'john@example.com',
              user_name: 'John Doe',
              completed_at: '2025-01-01',
              score: 95,
            },
          ]}
        />
      )}
    </div>
  );
};

export default ComplianceTraining;


