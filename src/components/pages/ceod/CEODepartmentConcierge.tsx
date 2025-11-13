import { MessageSquare } from 'lucide-react';
import { CEODepartmentDetail } from './CEODepartmentDetail';

export function CEODepartmentConcierge() {
  return (
    <CEODepartmentDetail
      department="concierge"
      title="Concierge"
      description="Member interactions and support touchpoints"
      icon={MessageSquare}
      color="text-teal-600"
      gradient="from-teal-500 to-teal-600"
    />
  );
}
