import { CEODashboardLayout } from '../../../layouts/CEODashboardLayout';
import NotepadWithSharing from '../../NotepadWithSharing';

export function CEONotepad() {
  return (
    <CEODashboardLayout>
      <NotepadWithSharing dashboardRole="ceo" dashboardTitle="CEO" />
    </CEODashboardLayout>
  );
}
