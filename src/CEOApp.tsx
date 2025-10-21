import { Routes, Route, Navigate } from 'react-router-dom';
import CEOSidebar from './components/CEOSidebar';
import CEOOverview from './components/pages/ceo/CEOOverview';
import CEOSales from './components/pages/ceo/CEOSales';
import CEOMarketing from './components/pages/ceo/CEOMarketing';
import AuthWrapper from './components/pages/AuthWrapper';

const CEOEnrollments = () => <div className="p-8"><h1 className="text-2xl font-bold">Enrollment Insights - Coming Soon</h1></div>;
const CEOAgents = () => <div className="p-8"><h1 className="text-2xl font-bold">Agent Performance - Coming Soon</h1></div>;
const CEOOperations = () => <div className="p-8"><h1 className="text-2xl font-bold">Operations Dashboard - Coming Soon</h1></div>;
const CEOFinancial = () => <div className="p-8"><h1 className="text-2xl font-bold">Financial Overview - Coming Soon</h1></div>;
const CEOGoals = () => <div className="p-8"><h1 className="text-2xl font-bold">Strategic Goals - Coming Soon</h1></div>;
const CEOReports = () => <div className="p-8"><h1 className="text-2xl font-bold">Reports & Analytics - Coming Soon</h1></div>;
const CEONotifications = () => <div className="p-8"><h1 className="text-2xl font-bold">Notifications - Coming Soon</h1></div>;
const CEOSettings = () => <div className="p-8"><h1 className="text-2xl font-bold">Settings - Coming Soon</h1></div>;

function CEOApp() {
  return (
    <AuthWrapper>
      <div className="flex min-h-screen bg-slate-50">
        <CEOSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<CEOOverview />} />
            <Route path="/sales" element={<CEOSales />} />
            <Route path="/marketing" element={<CEOMarketing />} />
            <Route path="/enrollments" element={<CEOEnrollments />} />
            <Route path="/agents" element={<CEOAgents />} />
            <Route path="/operations" element={<CEOOperations />} />
            <Route path="/financial" element={<CEOFinancial />} />
            <Route path="/goals" element={<CEOGoals />} />
            <Route path="/reports" element={<CEOReports />} />
            <Route path="/notifications" element={<CEONotifications />} />
            <Route path="/settings" element={<CEOSettings />} />
            <Route path="*" element={<Navigate to="/ceo" replace />} />
          </Routes>
        </main>
      </div>
    </AuthWrapper>
  );
}

export default CEOApp;

