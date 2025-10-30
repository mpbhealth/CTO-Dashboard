import { CEODashboardLayout } from '../../../layouts/CEODashboardLayout';
import Overview from '../../Overview';

export function CEODevelopmentOverview() {
  return (
    <CEODashboardLayout>
      <div className="p-6">
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Read-Only View:</strong> This is the CEO view of development planning. Contact CTO for changes.
          </p>
        </div>
        <Overview />
      </div>
    </CEODashboardLayout>
  );
}
