import { CTODashboardLayout } from '../../../layouts/CTODashboardLayout';
import SimpleNotepad from '../../SimpleNotepad';

export function CTONotepad() {
  return (
    <CTODashboardLayout>
      <SimpleNotepad dashboardRole="cto" dashboardTitle="CTO" />
    </CTODashboardLayout>
  );
}
