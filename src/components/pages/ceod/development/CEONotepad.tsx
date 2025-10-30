import { CEODashboardLayout } from '../../../layouts/CEODashboardLayout';
import SimpleNotepad from '../../SimpleNotepad';

export function CEONotepad() {
  return (
    <CEODashboardLayout>
      <SimpleNotepad dashboardRole="ceo" dashboardTitle="CEO" />
    </CEODashboardLayout>
  );
}
