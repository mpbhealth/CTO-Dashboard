import { CTODashboardLayout } from '../../../layouts/CTODashboardLayout';
import NotepadWithSharing from '../../NotepadWithSharing';

export function CTONotepad() {
  return (
    <CTODashboardLayout>
      <NotepadWithSharing dashboardRole="cto" dashboardTitle="CTO" />
    </CTODashboardLayout>
  );
}
