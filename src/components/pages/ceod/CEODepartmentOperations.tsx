import { Activity } from 'lucide-react';
import { CEODepartmentDetail } from './CEODepartmentDetail';

export function CEODepartmentOperations() {
  return (
    <CEODepartmentDetail
      department="operations"
      title="Operations"
      description="Cancellation and churn metrics"
      icon={Activity}
      color="text-orange-600"
      gradient="from-orange-500 to-orange-600"
    />
  );
}
