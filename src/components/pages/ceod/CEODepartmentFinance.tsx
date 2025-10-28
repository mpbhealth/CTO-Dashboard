import { DollarSign } from 'lucide-react';
import { CEODepartmentDetail } from './CEODepartmentDetail';

export function CEODepartmentFinance() {
  return (
    <CEODepartmentDetail
      department="finance"
      title="Finance"
      description="Financial records (AR, AP, Payouts)"
      icon={DollarSign}
      color="text-green-600"
      gradient="from-green-500 to-green-600"
    />
  );
}
